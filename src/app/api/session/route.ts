import { NextResponse } from "next/server";
import { isCampusEmailAllowed, signSession, verifySession } from "@/lib/security";

const VALID_GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;
type Gender = (typeof VALID_GENDERS)[number];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const { email, gender } = body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    // 1. Institutional campus domain verification
    if (!isCampusEmailAllowed(normalizedEmail)) {
      return NextResponse.json(
        {
          error:
            "Access restricted: Institutional email required (.edu, .ac.in, or @thapar.edu).",
        },
        { status: 403 }
      );
    }

    // 2. Gender profile validation
    if (!VALID_GENDERS.includes(gender as Gender)) {
      return NextResponse.json(
        { error: "Please select a valid gender option for safety matching." },
        { status: 400 }
      );
    }

    // 3. Cryptographically signed campus session token
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 8 * 60 * 60 * 1000; // 8 hours
    const payloadObject = {
      email: normalizedEmail,
      gender: gender as Gender,
      issuedAt,
      expiresAt,
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payloadObject)).toString("base64url");
    const signature = signSession(payloadBase64);
    const token = `${payloadBase64}.${signature}`;

    const response = NextResponse.json({
      success: true,
      profile: {
        email: normalizedEmail,
        gender: gender as Gender,
      },
      token,
    });

    response.cookies.set("cabsync_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Session Generation Error]", error);
    return NextResponse.json(
      { error: "Could not create verified campus session." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/cabsync_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const token = match[1];
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const isValid = verifySession(payloadBase64, signature);
    if (!isValid) {
      return NextResponse.json({ authenticated: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    if (Date.now() > payload.expiresAt) {
      return NextResponse.json({ authenticated: false, error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      profile: {
        email: payload.email,
        gender: payload.gender,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
