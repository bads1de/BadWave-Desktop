import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // URLからコードを取得
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      console.error("認証コードがありません");
      return NextResponse.json(
        { error: "認証コードがありません" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // codeを使用してセッションを交換
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("認証エラー:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 認証成功時はセッション情報を返す
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", error);

    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
