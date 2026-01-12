import { EQ_BANDS } from "@/hooks/stores/useEqualizerStore";

/**
 * オーディオ要素とWeb Audio APIノードを管理するシングルトン
 * Reactのライフサイクル外で永続化し、ページ遷移でも再生を継続する
 */
class AudioEngine {
  private static instance: AudioEngine | null = null;

  // Audio要素
  public audio: HTMLAudioElement | null = null;

  // Web Audio API ノード
  public context: AudioContext | null = null;
  public sourceNode: MediaElementAudioSourceNode | null = null;
  public filters: BiquadFilterNode[] = [];
  public gainNode: GainNode | null = null;
  public reverbGainNode: GainNode | null = null;
  public convolver: ConvolverNode | null = null;
  public spatialFilter: BiquadFilterNode | null = null;
  private isSpatialActive = false; // Spatial Mode 内部状態
  private isSlowedReverbActive = false; // Slowed+Reverb 内部状態

  // 8D Audio ノード
  public stereoPanner: StereoPannerNode | null = null;
  private lfoOscillator: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private is8DAudioActive = false;

  // Lo-Fi ノード
  public loFiLowPass: BiquadFilterNode | null = null;
  public loFiHighPass: BiquadFilterNode | null = null;
  private isLoFiActive = false;

  // 状態管理
  public currentSongId: string | null = null;
  public isInitialized = false;

  private constructor() {
    // ブラウザ環境でのみ audio 要素を作成
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Web Audio API グラフを初期化（イコライザー、リバーブ含む）
   * 一度だけ呼ばれる
   */
  public initialize(): void {
    if (!this.audio || this.isInitialized) return;

    try {
      this.context = new AudioContext();
      this.sourceNode = this.context.createMediaElementSource(this.audio);

      // --- ノード作成 ---

      // 6バンドイコライザーフィルターを作成
      this.filters = EQ_BANDS.map((band, index) => {
        const filter = this.context!.createBiquadFilter();
        if (index === 0) {
          filter.type = "lowshelf";
        } else if (index === EQ_BANDS.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.frequency.value = band.freq;
        filter.gain.value = 0;
        return filter;
      });

      // 空間オーディオ用（ダンスホール風）フィルタ
      // LowPassフィルタで高音を削り、こもった音を作る
      this.spatialFilter = this.context.createBiquadFilter();
      this.spatialFilter.type = "lowpass";
      this.spatialFilter.frequency.value = 22050; // デフォルトは全通（エフェクトなし）
      this.spatialFilter.Q.value = 1.0; // 少し共振させて「箱鳴り」感を出す

      // マスターゲインノード
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = 1;

      // リバーブ用コンボルバーとゲインノード
      this.convolver = this.context.createConvolver();
      this.reverbGainNode = this.context.createGain();
      this.reverbGainNode.gain.value = 0;

      // インパルス応答を生成
      this.setupImpulseResponse();

      // --- 8D Audio ノード作成 ---
      this.stereoPanner = this.context.createStereoPanner();
      this.stereoPanner.pan.value = 0; // 中央から開始

      // LFO (Low Frequency Oscillator) でパン値を自動制御
      this.lfoOscillator = this.context.createOscillator();
      this.lfoOscillator.type = "sine";
      this.lfoOscillator.frequency.value = 0.25; // 4秒で1周（デフォルト）

      this.lfoGain = this.context.createGain();
      this.lfoGain.gain.value = 0; // 初期はOFF（8D無効）

      // LFO -> LFOGain -> StereoPanner.pan
      this.lfoOscillator.connect(this.lfoGain);
      this.lfoGain.connect(this.stereoPanner.pan);
      this.lfoOscillator.start();

      // --- Lo-Fi ノード作成 ---
      // High Pass: 低音を削る
      this.loFiHighPass = this.context.createBiquadFilter();
      this.loFiHighPass.type = "highpass";
      this.loFiHighPass.frequency.value = 0; // 初期は全通（0Hz）
      this.loFiHighPass.Q.value = 0.5;

      // Low Pass (High Cut): 高音を削る
      this.loFiLowPass = this.context.createBiquadFilter();
      this.loFiLowPass.type = "lowpass";
      this.loFiLowPass.frequency.value = 22050; // 初期は全通
      this.loFiLowPass.Q.value = 0.5;

      // --- 接続 (Routing) ---
      // Main Path: Source -> EQ -> Spatial -> 8D Panner -> Lo-Fi(HighPass->LowPass) -> MasterGain -> Dest
      let currentNode: AudioNode = this.sourceNode;

      this.filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      // Spatial Filter 接続
      currentNode.connect(this.spatialFilter);
      currentNode = this.spatialFilter;

      // 8D Audio Panner 接続
      currentNode.connect(this.stereoPanner);
      currentNode = this.stereoPanner;

      // Lo-Fi Filters 接続
      currentNode.connect(this.loFiHighPass);
      currentNode.connect(this.loFiLowPass);
      currentNode = this.loFiLowPass;

      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);

      // Reverb Path: (After effects) -> ReverbGain -> Convolver -> Dest
      this.stereoPanner.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.convolver);
      this.convolver.connect(this.context.destination);

      this.isInitialized = true;
      console.log("[AudioEngine] Initialized successfully");
    } catch (error) {
      console.error("[AudioEngine] Initialization failed:", error);
    }
  }

  private setupImpulseResponse(): void {
    if (!this.context || !this.convolver) return;

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 3;
    const impulse = this.context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.pow((length - i) / length, 2);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver.buffer = impulse;
  }

  /**
   * AudioContextをresumeする（ユーザー操作後に呼ぶ）
   */
  public async resumeContext(): Promise<void> {
    if (this.context && this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  /**
   * リバーブ量 (Wet/Dry の Wet成分) を設定 (0.0 - 1.0)
   * ※直接呼び出すのではなく、updateReverbState経由で使用する
   */
  public setReverbGain(value: number): void {
    if (this.reverbGainNode) {
      this.reverbGainNode.gain.value = Math.max(0, Math.min(value, 2.0));
    }
  }

  /**
   * 現在のアクティブなモードに基づいてリバーブゲインを更新
   * 優先度: Spatial > SlowedReverb
   */
  private updateReverbState(): void {
    if (this.isSpatialActive) {
      this.setReverbGain(0.8);
    } else if (this.isSlowedReverbActive) {
      this.setReverbGain(0.6);
    } else {
      this.setReverbGain(0);
    }
  }

  /**
   * 空間オーディオ（Spatial Mode）の有効/無効切り替え
   */
  public setSpatialMode(enabled: boolean): void {
    if (!this.spatialFilter) return;

    const now = this.context?.currentTime || 0;
    this.isSpatialActive = enabled;

    if (enabled) {
      // ON: 800Hz以上をカット（こもらせる）
      this.spatialFilter.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    } else {
      // OFF: 22050Hz (全通)
      this.spatialFilter.frequency.exponentialRampToValueAtTime(
        22050,
        now + 0.2
      );
    }

    // リバーブ状態を更新
    this.updateReverbState();
  }

  /**
   * 低速+リバーブモードの設定
   */
  public setSlowedReverbMode(enabled: boolean): void {
    this.isSlowedReverbActive = enabled;
    this.updateReverbState();
  }

  /**
   * ピッチ補正（preservesPitch）の設定
   * true: 速度を変えても音程を維持する（通常）
   * false: 速度を変えると音程も変わる（テープ再生風、Slowed+Reverb用）
   */
  public setPreservesPitch(preserve: boolean): void {
    if (!this.audio) return;

    this.audio.preservesPitch = preserve;
    // クロスブラウザ対応
    // @ts-ignore
    this.audio.mozPreservesPitch = preserve;
    // @ts-ignore
    this.audio.webkitPreservesPitch = preserve;
  }

  // ========================================
  // 8D Audio
  // ========================================

  /**
   * 8D Audio（自動パンニング）の有効/無効を切り替え
   * @param enabled 有効にするかどうか
   * @param rotationPeriod 1周にかかる秒数（デフォルト4秒）
   */
  public set8DAudioMode(enabled: boolean, rotationPeriod = 4): void {
    if (!this.lfoGain || !this.lfoOscillator) return;

    const now = this.context?.currentTime || 0;

    if (enabled) {
      // LFOゲインを1にして回転を有効化
      this.lfoGain.gain.linearRampToValueAtTime(1, now + 0.3);
      // 回転速度を設定
      this.lfoOscillator.frequency.value = 1 / rotationPeriod;
      this.is8DAudioActive = true;
    } else {
      // LFOゲインを0にして回転を停止
      this.lfoGain.gain.linearRampToValueAtTime(0, now + 0.3);
      this.is8DAudioActive = false;
    }
  }

  /**
   * 8D Audioの回転速度を変更（有効時のみ効果あり）
   * @param rotationPeriod 1周にかかる秒数
   */
  public set8DRotationSpeed(rotationPeriod: number): void {
    if (!this.lfoOscillator || !this.is8DAudioActive) return;

    // 周波数 = 1 / 周期（秒）
    const frequency = 1 / rotationPeriod;
    const now = this.context?.currentTime || 0;
    this.lfoOscillator.frequency.linearRampToValueAtTime(frequency, now + 0.1);
  }

  // ========================================
  // Lo-Fi / Vintage Radio Mode
  // ========================================

  /**
   * Lo-Fi / Vintage Radio モードの有効/無効を切り替え
   * クラックルノイズ無し、帯域制限のみで温かみを出す
   */
  public setLoFiMode(enabled: boolean): void {
    if (!this.loFiLowPass || !this.loFiHighPass || !this.context) return;

    const now = this.context.currentTime;

    if (enabled) {
      // 温かみのあるラジオボイス設定
      // HighPass: 500Hz以下をカット (低音を削る)
      this.loFiHighPass.frequency.exponentialRampToValueAtTime(500, now + 0.3);
      this.loFiHighPass.Q.value = 0.8;

      // LowPass: 3000Hz以上をカット (高音を削る)
      this.loFiLowPass.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
      this.loFiLowPass.Q.value = 0.5; // マイルドに

      this.isLoFiActive = true;
    } else {
      // フィルターを全通に戻す
      // HighPass -> 10Hz (0にはできないため低い値)
      this.loFiHighPass.frequency.exponentialRampToValueAtTime(10, now + 0.3);
      this.loFiHighPass.Q.value = 0.5;

      // LowPass -> 22050Hz
      this.loFiLowPass.frequency.exponentialRampToValueAtTime(22050, now + 0.3);
      this.loFiLowPass.Q.value = 0.5;

      this.isLoFiActive = false;
    }
  }
}

export { AudioEngine };
