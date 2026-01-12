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
  /* ... (中略) ... */

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
