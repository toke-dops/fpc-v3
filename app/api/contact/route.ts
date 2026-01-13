import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CONTACT_EMAIL = "findpadelclubs@gmail.com";

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Initialize Resend client
    const resend = new Resend(RESEND_API_KEY);

    const body = await request.json();
    const { name, email, subject, message, formType } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const emailSubject = subject || formType || "Contact Form Submission";
    
    // Format email body as plain text
    const emailBodyText = `
Name: ${name}
Email: ${email}
${subject ? `Subject: ${subject}` : ''}
${formType ? `Form Type: ${formType}` : ''}

Message:
${message}
    `.trim();

    // Format email body as HTML
    const emailBodyHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        ${formType ? `<p><strong>Form Type:</strong> ${formType}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This email was sent from the Find Padel Clubs contact form.</p>
      </div>
    `;

    // Send email via Resend API
    console.log("Attempting to send email via Resend...");
    console.log("From: noreply@kuudra.resend.app");
    console.log("To:", CONTACT_EMAIL);
    console.log("Subject:", emailSubject);
    
    try {
      const { data, error } = await resend.emails.send({
        from: "noreply@kuudra.resend.app",
        to: [CONTACT_EMAIL],
        replyTo: email,
        subject: emailSubject,
        text: emailBodyText,
        html: emailBodyHtml,
      });

      if (error) {
        console.error("Resend API error:", JSON.stringify(error, null, 2));
        console.error("Error type:", error?.name);
        console.error("Error message:", error?.message);
        
        // Provide more specific error messages
        let errorMessage = "Failed to send email. Please try again or contact us directly at findpadelclubs@gmail.com";
        
        if (error?.message?.includes("domain") || error?.message?.includes("verify")) {
          errorMessage = "Email domain not verified. Please verify kuudra.resend.app in your Resend dashboard.";
        } else if (error?.message?.includes("api_key") || error?.message?.includes("authentication")) {
          errorMessage = "Email service authentication failed. Please check API key configuration.";
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: error.message || "Unknown error",
            errorCode: error?.name || "UNKNOWN"
          },
          { status: 500 }
        );
      }

      if (!data) {
        console.error("Resend returned no data and no error - unexpected response");
        return NextResponse.json(
          { 
            error: "Email service returned an unexpected response. Please try again.",
          },
          { status: 500 }
        );
      }

      console.log("Email sent successfully via Resend. Email ID:", data.id);
    } catch (resendError: any) {
      console.error("Resend send exception:", resendError);
      return NextResponse.json(
        { 
          error: "Failed to send email. Please try again or contact us directly at findpadelclubs@gmail.com",
          details: resendError?.message || "Unknown error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again or contact us directly at findpadelclubs@gmail.com",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

