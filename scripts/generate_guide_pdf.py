#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PitStop Complete Project Guide Generator (Hinglish)
Generates a professional, branded multi-page PDF guide in the PitStop root folder.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

# Color Tokens from PitStop Design System
PRIMARY_YELLOW = colors.HexColor('#F7B928')
YELLOW_DARK = colors.HexColor('#D97706')
YELLOW_LIGHT = colors.HexColor('#FEF3C7')
CHARCOAL = colors.HexColor('#202124')
MUTED_GRAY = colors.HexColor('#4B5563')
LIGHT_BG = colors.HexColor('#F8FAFC')
BORDER_COLOR = colors.HexColor('#E2E8F0')
SUCCESS_GREEN = colors.HexColor('#16A34A')
INFO_BLUE = colors.HexColor('#2563EB')
WHITE = colors.HexColor('#FFFFFF')


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page numbers:
    'Page X of Y' along with header and footer bars.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()

        # Suppress headers on Cover/Title Page
        if self._pageNumber > 1:
            # Header line
            self.setStrokeColor(PRIMARY_YELLOW)
            self.setLineWidth(1.5)
            self.line(40, 802, 555, 802)

            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(CHARCOAL)
            self.drawString(40, 808, "PITSTOP INDIA")

            self.setFont("Helvetica", 8)
            self.setFillColor(MUTED_GRAY)
            self.drawString(110, 808, "|  Complete Architecture, Flow & Feature Guide (Hinglish)")

        # Footer
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.8)
        self.line(40, 42, 555, 42)

        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED_GRAY)
        self.drawString(40, 30, "PitStop Web Platform  —  Confidential & Internal Documentation")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 30, page_str)

        self.restoreState()


def build_pdf(filename="PitStop_Complete_Project_Guide_Hinglish.pdf"):
    target_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", filename))
    doc = SimpleDocTemplate(
        target_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=52,
        bottomMargin=52,
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=CHARCOAL,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=MUTED_GRAY,
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=CHARCOAL,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=YELLOW_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=CHARCOAL,
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=CHARCOAL,
        leftIndent=15,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8.5,
        leading=11,
        textColor=CHARCOAL,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=WHITE,
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=CHARCOAL,
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=CHARCOAL,
    )

    story = []

    # -------------------------------------------------------------
    # COVER / HEADER BANNER
    # -------------------------------------------------------------
    banner_data = [
        [
            Paragraph("<b>PITSTOP</b>", ParagraphStyle('BTitle', fontName='Helvetica-Bold', fontSize=28, leading=30, textColor=CHARCOAL)),
            Paragraph("<b>PROJECT MASTER GUIDE</b><br/><font size=8.5 color='#4B5563'>Architecture, User Flow, Portals & Features (Hinglish)</font>", ParagraphStyle('BSub', fontName='Helvetica', fontSize=10, leading=14, textColor=CHARCOAL, alignment=2))
        ]
    ]
    banner_table = Table(banner_data, colWidths=[200, 315])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_YELLOW),
        ('PADDING', (0, 0), (-1, -1), 14),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 14))

    # Meta Overview Box
    meta_box = [
        [
            Paragraph("<b>Application:</b> PitStop Web Monorepo", table_cell_style),
            Paragraph("<b>Target Audience:</b> Gig Workers & Local Merchants", table_cell_style),
        ],
        [
            Paragraph("<b>Version:</b> 1.0.0 (Production Verified)", table_cell_style),
            Paragraph("<b>Tech:</b> Next.js 14 + Node/Express + MongoDB Atlas", table_cell_style),
        ]
    ]
    meta_table = Table(meta_box, colWidths=[255, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # 1. HAMNE KYA BANAYA HAI (WHAT WE BUILT)
    # -------------------------------------------------------------
    story.append(Paragraph("1. Hamne Kya Banaya Hai (What is PitStop?)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph(
        "<b>PitStop</b> India ke <b>1.5+ crore gig delivery workers</b> (Zomato, Swiggy, Zepto, Blinkit, Uber, Shadowfax) "
        "aur <b>local merchants</b> (Chai Point, Cafe, Kirana, Restaurants) ke beech ka ek dedicated ecosystem platform hai.",
        body_style
    ))
    story.append(Paragraph(
        "Delivery riders din bhar garmi, baarish aur traffic mein 10-12 ghante sadak par bike chalate hain. Unke paas na koi clean washroom hota hai, na phone charge karne ki jagah, na saaf peene ka paani. Dusri taraf, local merchants ke paas non-peak hours (jaise 2 PM se 5 PM) mein empty seating space aur unused capacity hoti hai.",
        body_style
    ))
    story.append(Paragraph(
        "<b>PitStop in dono ko aapas mein connect karta hai:</b>",
        body_style
    ))
    story.append(Paragraph("• <b>Riders ke liye:</b> Ek verified shelter jahan clean washroom, RO chilled drinking water, fast phone charging, shade aur bike parking mile, sath mein sasta khana (exclusive deals) aur extra paise kamane ke micro-jobs.", bullet_style))
    story.append(Paragraph("• <b>Merchants ke liye:</b> Apne khali space ko monetize karna, high footfall attract karna, snacks/tea ki sales badhana, aur peak rush hours mein parcel sorting ya packing ke liye trusted gig workers hire karna.", bullet_style))
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 2. KAISA WORK KARTA HAI PURA FLOW (USER JOURNEY & WORKFLOW)
    # -------------------------------------------------------------
    story.append(Paragraph("2. Kaisa Work Karta Hai Pura Flow (Rider & Merchant Journey)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("A. Delivery Rider (Gig Worker) Ka Complete Flow:", h2_style))
    rider_steps = [
        ("Step 1: Onboarding", "Rider apna Phone/Email aur password se register karta hai, aur apni delivery platform (Zomato, Swiggy, Zepto, etc.) select karta hai."),
        ("Step 2: Discovery (/explore)", "Rider GPS Google Map ya List View par nearby verified Rest Stops search karta hai. Amenities filters (Water, Washroom, Charging, Seating) use karke pass ka store chun-ta hai."),
        ("Step 3: Navigation", "'Get Directions' par click karke rider Google Maps ke turn-by-turn route se seedhe merchant ke store par pahunchta hai."),
        ("Step 4: QR Check-In", "Store counter par lage PitStop QR Code ko apne mobile camera se scan karta hai. Instant verified check-in record hota hai."),
        ("Step 5: Perks & Deals", "Check-in hote hi store ke exclusive discounts unlock ho jate hain (jaise 15% off chai & bun maska)."),
        ("Step 6: Micro-Jobs Apply", "Khali waiting time mein rider nearby stores ke micro-jobs (jaise 90 min parcel packing @ Rs. 250) browse karta hai aur 1-click apply karta hai."),
        ("Step 7: Job Payout & History", "Job complete karke rider direct cash/UPI payout receive karta hai aur apni profile mein earning history track karta hai.")
    ]

    for title, desc in rider_steps:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("B. Local Merchant (Store Owner) Ka Complete Flow:", h2_style))
    merchant_steps = [
        ("Step 1: Partner Registration", "Store owner Merchant Portal (/merchant/register) par account create karta hai."),
        ("Step 2: Rest Stop Setup", "Venue ka name, exact address, GPS coordinates, operating hours (Mon-Sun), seating capacity aur facilities add karta hai."),
        ("Step 3: Admin Approval", "Safety aur quality guarantee ke liye Admin team rest-stop ko verify karke active karti hai."),
        ("Step 4: Branded QR Print", "Merchant portal se cryptographic QR code print karke apne counter/billing desk par display karta hai."),
        ("Step 5: Deals Launch", "Riders ko invite karne ke liye promotional deals create karta hai (e.g. 2 PM - 5 PM special combo)."),
        ("Step 6: Micro-Jobs Post", "Rush hours mein helper ki need ho toh micro-job post karta hai (timing, payout, required riders)."),
        ("Step 7: Rider Management", "Real-time occupancy track karta hai aur job applicants ko 1-click accept/reject karta hai.")
    ]

    for title, desc in merchant_steps:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 3. KITNE PORTALS HAIN ISME (PORTAL ARCHITECTURE)
    # -------------------------------------------------------------
    story.append(KeepTogether([
        Paragraph("3. Kitne Portals Hain Isme Aur Vo Kya Kaam Karte Hain?", h1_style),
        HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2),
        Paragraph("PitStop pure system ko <b>4 major portals</b> mein divide karta hai:", body_style)
    ]))

    portals_table_data = [
        [
            Paragraph("<b>Portal Name</b>", table_header_style),
            Paragraph("<b>Primary Route</b>", table_header_style),
            Paragraph("<b>Kaun Use Karta Hai</b>", table_header_style),
            Paragraph("<b>Core Kaam & Responsibility</b>", table_header_style)
        ],
        [
            Paragraph("<b>1. Public Discovery Portal</b>", table_cell_style),
            Paragraph("<code>/</code><br/><code>/explore</code><br/><code>/jobs</code>", table_cell_style),
            Paragraph("Koi bhi visitor ya unregistered rider", table_cell_style),
            Paragraph("Rest stops browse karna, live Google Map dekhna, amenities filter karna, deals aur open jobs dekhna.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Rider Command Portal</b>", table_cell_style),
            Paragraph("<code>/rider/dashboard</code><br/><code>/rider/applications</code>", table_cell_style),
            Paragraph("Verified Gig Delivery Workers", table_cell_style),
            Paragraph("Live camera QR scan karke check-in karna, check-in history dekhna, micro-jobs apply karna aur application status track karna.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Merchant Portal</b>", table_cell_style),
            Paragraph("<code>/merchant/dashboard</code><br/><code>/merchant/rest-stops</code><br/><code>/merchant/deals</code><br/><code>/merchant/jobs</code>", table_cell_style),
            Paragraph("Store Owners / Cafe Managers", table_cell_style),
            Paragraph("Rest stop venue details edit karna, venue QR code download/rotate karna, deals post karna, micro-jobs create karna aur job applicants hire karna.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Super Admin Portal</b>", table_cell_style),
            Paragraph("<code>/admin</code><br/><code>/admin/rest-stops</code><br/><code>/admin/merchants</code><br/><code>/admin/audit-logs</code>", table_cell_style),
            Paragraph("PitStop Platform Governance & Ops Team", table_cell_style),
            Paragraph("Pending venues ko verify/approve/suspend karna, merchants manage karna, tamper-proof audit logs monitor karna aur platform analytics dekhna.", table_cell_style)
        ]
    ]

    p_table = Table(portals_table_data, colWidths=[110, 100, 105, 200])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), CHARCOAL),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # 4. KYA KYA FEATURES HAIN ISME (KEY FEATURES)
    # -------------------------------------------------------------
    story.append(Paragraph("4. Kya-Kya Features Hain Isme? (Detailed Feature Set)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2))

    features = [
        ("Interactive Google Maps View", "Centralized interactive Google Map with custom PitStop yellow pins, venue detail popups (InfoWindows), GPS 'Locate Me' current position finder, aur turn-by-turn route navigation links."),
        ("Multi-Facility AND Filtering", "Drinking Water, Clean Washroom, Phone Charging, Wi-Fi, Seating Area, aur Safe Bike Parking ke multi-select filters strict AND logic ke sath."),
        ("Live Capacity Management", "Real-time occupancy counter (Available / Busy / Full) taaki kisi bhi store par bheed (overcrowding) na ho."),
        ("Cryptographic QR Check-In Protocol", "HMAC-SHA256 signature signed QR codes taaki koi ghar baithe ya fake coordinates se check-in na kar sake. Physical store presence mandatory."),
        ("Rider Deals & Discounts Engine", "Merchants time-limited deals post kar sakte hain (e.g. 15% off chai & snacks) jo check-in verify hone par claim kiye ja sakte hain."),
        ("Micro-Jobs Marketplace", "Local merchants parcel sorting, loading ya delivery tasks post karte hain. MongoDB atomic operations ensure karte hain ki required capacity se zyada riders accept na hon."),
        ("Zero Client Trust Security", "Sari security checks (JWT, role guards, QR signatures, capacity limits) server-side execute hoti hain. Frontend par koi blind trust nahi."),
        ("100% Mobile-First Responsive UI", "320px screen wale delivery phone se lekar desktop tak smooth bottom navigation bar aur touch-friendly UI components.")
    ]

    for title, desc in features:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 12))

    # -------------------------------------------------------------
    # 5. QR CODE KYA KAAM KARTA HAI ISME (QR CODE PROTOCOL & SECURITY)
    # -------------------------------------------------------------
    story.append(KeepTogether([
        Paragraph("5. QR Code Kya Kaam Karta Hai Isme? (Security & Protocol)", h1_style),
        HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2),
        Paragraph(
            "PitStop platform mein QR Code sabse critical security layer hai. Iska kaam sirf ek link kholna nahi hai, "
            "balki <b>Proof of Physical Presence</b> verify karna hai.",
            body_style
        )
    ]))

    qr_points = [
        ("Kahan Laga Hota Hai?", "Har approved rest stop counter par ek customized PitStop QR Standee / Poster lagaya jata hai."),
        ("Fake Check-In Rokna:", "Agar simple URL ho toh koi bhi rider group mein WhatsApp par link share karke ghar baithe check-in kar sakta hai. PitStop isko rokne ke liye HMAC-SHA256 Cryptographic Signature use karta hai."),
        ("QR Code Ke Andar Kya Hota Hai?", "QR payload contains: <code>{ restStopId, slug, version, signature }</code>. Signature backend ke private secret key se sign hota hai."),
        ("Scanner Workflow:", "Rider apne phone camera se scan karta hai -> payload backend API <code>/api/check-ins/verify</code> par jata hai -> Server mathematical signature re-compute karta hai -> Verify hone par check-in active hota hai."),
        ("Instant QR Rotation (Emergency Security):", "Agar kisi QR code ka print photo leak ho jaye, merchant apne portal se 1-click 'Rotate QR' button dabata hai. Backend version number badha deta hai jisse purana print QR code instantly expire (invalid) ho jata hai.")
    ]

    for title, desc in qr_points:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # Security Callout Box
    sec_box_data = [[
        Paragraph(
            "<b>Security Insight:</b> PitStop QR Protocol garantee karta hai ki Rider sach mein dukan par aaya hai. "
            "Isse merchant ko guaranteed footfall milta hai aur genuine gig worker ko hi verified benefits milte hain.",
            callout_style
        )
    ]]
    sec_table = Table(sec_box_data, colWidths=[515])
    sec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), YELLOW_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, YELLOW_DARK),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(sec_table)
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # 6. SECURITY ARCHITECTURE & DATA PROTECTION
    # -------------------------------------------------------------
    story.append(KeepTogether([
        Paragraph("6. Security Architecture & Data Protection (Enterprise Standards)", h1_style),
        HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2),
        Paragraph(
            "PitStop platform gig workers ke data aur merchant business ko protect karne ke liye "
            "<b>Zero Client Trust</b> aur enterprise security standards implement karta hai:",
            body_style
        )
    ]))

    sec_features = [
        ("Zero Client Trust Principle", "Har critical check (price, status, capacity, QR validation) server-side execute hota hai. Frontend par koi blind trust nahi hota."),
        ("Password Hashing (Bcrypt)", "Database mein plain-text passwords kabhi save nahi hote; bcrypt 10 rounds of salt hashing se protected rehte hain."),
        ("HTTP-Only Secure Cookies (XSS Defense)", "JWT token browser LocalStorage mein nahi, balki httpOnly, sameSite=strict, secure cookie mein store hota hai. Malicious scripts token read nahi kar sakte."),
        ("Role-Based Access Control (RBAC)", "Strict server middleware guards: Rider, Merchant, Admin ke alag permissions hain. Merchant isolation guarantee karti hai ki koi dusre merchant ka data na chhed sake."),
        ("HMAC-SHA256 QR Protocol", "QR code server private key se cryptographically sign hota hai. Fake remote check-ins mathematically impossible hain. 1-click rotation se purane printouts instantly nullify ho jate hain."),
        ("Zod Input Validation", "Har endpoint par request body aur params Zod schemas se validate aur sanitize hote hain. Mass assignment aur NoSQL injections block rehte hain."),
        ("Atomic DB Operations", "Micro-jobs booking mein concurrent race condition locking MongoDB atomic operators ($inc, $lt) se guaranteed hoti hai."),
        ("Network Hardening & Helmet", "Express server par Helmet.js security headers (Clickjacking, MIME sniffing, XSS filter) aur strict CORS policy configured hai."),
        ("Tamper-Proof Audit Logging", "Admin ke sabhi major changes auditlogs collection mein permanent timestamp, IP aur user ID ke sath store hote hain.")
    ]

    for title, desc in sec_features:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 12))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # 7. OTHER DETAILS (TECH STACK, DATABASE, PRODUCTION VERIFICATION)
    # -------------------------------------------------------------
    story.append(Paragraph("7. Other Technical Details (Tech Stack, DB & Production Ready)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_YELLOW, spaceAfter=8, spaceBefore=2))

    tech_table_data = [
        [
            Paragraph("<b>Layer</b>", table_header_style),
            Paragraph("<b>Technology Used</b>", table_header_style),
            Paragraph("<b>Purpose & Role</b>", table_header_style)
        ],
        [
            Paragraph("<b>Frontend App</b>", table_cell_style),
            Paragraph("Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide Icons", table_cell_style),
            Paragraph("High performance SSR/SSG rendering, responsive mobile UI, client-side camera QR scanner, Google Maps interactive canvas.", table_cell_style)
        ],
        [
            Paragraph("<b>Backend REST API</b>", table_cell_style),
            Paragraph("Node.js + Express + TypeScript + Zod Validation", table_cell_style),
            Paragraph("Clean REST endpoints, JWT authorization, HMAC QR cryptography, Role-based route guards.", table_cell_style)
        ],
        [
            Paragraph("<b>Database</b>", table_cell_style),
            Paragraph("MongoDB Atlas / Local MongoDB + Mongoose ODM", table_cell_style),
            Paragraph("Collections: <code>users</code>, <code>reststops</code>, <code>deals</code>, <code>jobs</code>, <code>jobapplications</code>, <code>checkins</code>, <code>auditlogs</code>.", table_cell_style)
        ],
        [
            Paragraph("<b>Shared Types Package</b>", table_cell_style),
            Paragraph("TypeScript Monorepo Package (<code>packages/shared-types</code>)", table_cell_style),
            Paragraph("Frontend aur backend ke beech shared interfaces, DTOs, enums aur Zod validation schemas taaki end-to-end type safety rahe.", table_cell_style)
        ],
        [
            Paragraph("<b>Quality & Testing</b>", table_cell_style),
            Paragraph("438 Automated Tests + Strict TypeScript Typecheck", table_cell_style),
            Paragraph("327 API tests + 111 Web BFF tests with 100% pass rate. 0 ESLint errors. Next.js 59 routes compiled.", table_cell_style)
        ]
    ]

    t_table = Table(tech_table_data, colWidths=[110, 185, 220])
    t_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), CHARCOAL),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_table)
    story.append(Spacer(1, 14))

    # Summary Box
    summary_data = [[
        Paragraph(
            "<b>Nishkarsh (Conclusion):</b> PitStop ek complete, fully-tested, real-world platform hai jo India ke "
            "gig economy infrastructure ke sabse bade pain point ko solve karta hai. Har feature production-ready "
            "codebase aur strict enterprise security standards ke sath build kiya gaya hai.",
            callout_style
        )
    ]]
    sum_table = Table(summary_data, colWidths=[515])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(sum_table)

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF successfully generated at {target_path}")
    return target_path


if __name__ == "__main__":
    build_pdf()
