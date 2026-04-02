import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (body?.confirmation !== "УДАЛИТЬ") {
      return NextResponse.json(
        { error: "Неверное подтверждение удаления" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Пользователь не авторизован" },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminSupabase();
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account route error:", error);

    return NextResponse.json(
      { error: "Не удалось полностью удалить аккаунт" },
      { status: 500 }
    );
  }
}
