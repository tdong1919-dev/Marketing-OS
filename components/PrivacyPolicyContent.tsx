export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 text-sm text-text-secondary leading-relaxed">

      <div className="space-y-1 pb-4 border-b border-border">
        <h2 className="font-semibold text-text-primary text-base">Privacy Policy</h2>
        <p className="text-xs text-text-muted">Last Updated: May 2026 &nbsp;·&nbsp; Effective Date: May 2026</p>
      </div>

      {/* Introduction */}
      <section className="space-y-2">
        <p>Bare Branding Systems (&quot;Autom8ig,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Autom8 social media automation platform available at www.autom8ig.io (the &quot;Platform&quot;) and the Autom8 Business Diagnostic Tool available at diagnostic.autom8ig.io (the &quot;Diagnostic Tool&quot;). This Privacy Policy applies to both products and all subdomains, tools, features, and services operating under the autom8ig.io domain.</p>
        <p>This Privacy Policy describes what personal information we collect, why we collect it, how we use and share it, how long we keep it, and what rights you have over it. It applies to every visitor, user, lead, and subscriber who interacts with any Autom8ig product, regardless of whether you are a paying customer.</p>
        <p>By using the Platform or the Diagnostic Tool, you acknowledge you have read and understood this Privacy Policy. If you do not agree with any part of this policy, please do not use our products.</p>
        <p className="text-xs bg-surface border border-border rounded-xl px-3 py-2">This policy is designed to comply with applicable United States federal and state privacy laws, including CCPA/CPRA, CDPA, CPA, CTDPA, UCPA, TDPSA, MCDPA, OCPA, DPDPA, NHPA, NJDPA, ICDPA, NDPA, INCDPA, TIPA, MCDPA, MODPA, the FTC Act, the CAN-SPAM Act, and COPPA.</p>
      </section>

      {/* Section 1 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 1. Scope of This Policy</h3>
        <p>This Privacy Policy applies to:</p>
        <ul className="space-y-1 pl-4 list-none">
          {[
            "The Autom8ig website at www.autom8ig.io and all pages hosted on that domain.",
            "The Autom8 social media automation platform and all features within it, including account creation, OAuth integrations, content scheduling, automated posting, analytics dashboards, and any subscription or billing flows.",
            "The Autom8 Business Diagnostic Tool at diagnostic.autom8ig.io/scan and all related pages and features.",
            "All subdomains of autom8ig.io, including any future tools, features, or microsites hosted under that domain.",
            "Any email communications sent by Autom8ig to users or leads, including marketing emails, onboarding sequences, follow-up communications, and transactional notifications.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span className="text-text-muted shrink-0">({String.fromCharCode(97 + i)})</span><span>{item}</span></li>
          ))}
        </ul>
        <p>This policy does not apply to third-party websites, platforms, or services that we link to or integrate with.</p>
      </section>

      {/* Section 2 */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Section 2. Information We Collect</h3>
        <p>We collect personal information in three ways: information you provide voluntarily, information collected automatically, and information obtained from third-party platforms you connect to your account.</p>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">2.01 — Autom8 Platform</p>
          <p>When you create an account or use the Platform, we may collect: identity information (name, username), contact information (email), business information (business name, industry), billing and payment information (processed through third-party processors — we do not store full card numbers), OAuth credentials for connected social media accounts, user-generated content, and support communications.</p>
          <p className="text-xs bg-surface border border-border rounded-xl px-3 py-2">We do not store your social media passwords.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">2.02 — Business Diagnostic Tool</p>
          <p>When you use the Diagnostic Tool, we collect: contact information (name, email, business name), business profile information (industry, size, marketing practices, technology stack, goals), website URL information if you submit one for scanning, and all diagnostic responses you provide.</p>
          <p>By submitting the diagnostic form, you consent to the collection and use of this information including for sales follow-up and outreach.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">2.03 — Collected Automatically</p>
          <p>When you visit our website or use our products, we automatically collect: device and browser information, usage data (pages visited, features used, session duration), cookie and tracking data, log data, and approximate geolocation derived from your IP address. We do not collect precise GPS-level geolocation without your explicit consent.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">2.04 — From Third-Party Social Platforms</p>
          <p>When you connect a social media account via OAuth, we may access (with your permission): profile information, account content, performance and analytics data, and scheduling/publishing permissions as granted. You may revoke these permissions at any time through your connected platform settings or through your Autom8 account.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">2.05 — CCPA Categories</p>
          <p>We collect: Identifiers, Personal information (CA Civil Code §1798.80), Internet/electronic network activity, Professional/employment-related information, Geolocation (approximate, IP-derived), and Inferences drawn from diagnostic tool data.</p>
          <p className="text-xs bg-surface border border-border rounded-xl px-3 py-2">We do not collect sensitive personal information as defined under CPRA (Social Security numbers, precise geolocation, racial/ethnic origin, religious beliefs, health information, or biometric identifiers).</p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 3. How We Use Your Information</h3>
        <p>We use the information we collect for: service delivery, content automation, diagnostic analysis and report generation, sales qualification and outreach, marketing communications, product improvement, analytics and reporting, security and fraud prevention, legal compliance, and communications.</p>
        <p>If you submit the diagnostic form, you consent to being contacted by Autom8ig via email, and potentially by phone or other channels if you provide that information, regarding your diagnostic results and relevant product offerings.</p>
        <p className="text-xs bg-surface border border-border rounded-xl px-3 py-2">We do not sell your personal information. We do not use your personal information to train publicly available AI models without your explicit authorization.</p>
      </section>

      {/* Section 4 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 4. AI and Automated Processing</h3>
        <p><span className="text-text-primary font-medium">4.01 Platform:</span> The Autom8 Platform uses AI to assist in drafting social media content based on your brand settings. AI-generated content is a suggestion only — you are responsible for reviewing and approving all content before publishing.</p>
        <p><span className="text-text-primary font-medium">4.02 Diagnostic Tool:</span> The Diagnostic Tool uses automated analysis and AI to process your diagnostic responses and generate a business diagnostic report. If you believe the automated analysis produced an inaccurate assessment, you have the right to contact us and request a human review. See Section 9 for how to submit such a request.</p>
        <p><span className="text-text-primary font-medium">4.03 Subprocessors:</span> Your data may be processed by trusted third-party subprocessors who provide infrastructure, AI, analytics, and operational services. We require all subprocessors to maintain appropriate data security practices and process your data only for specified purposes.</p>
      </section>

      {/* Section 5 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 5. How We Share Your Information</h3>
        <p>We share personal information only in the following circumstances: (a) service providers and subprocessors, (b) CRM and marketing automation systems (when you submit the Diagnostic Tool), (c) analytics and advertising platforms (Google Analytics, Meta Pixel, LinkedIn Insight Tag, TikTok Pixel — this may constitute sharing for cross-context behavioral advertising under applicable law), (d) business transfers, (e) legal requirements, and (f) with your consent.</p>
        <p className="text-xs bg-surface border border-border rounded-xl px-3 py-2">We do not sell personal information. We do not rent personal information. We do not share personal information with unaffiliated third parties for their own independent marketing purposes without your explicit consent.</p>
      </section>

      {/* Section 6 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 6. Cookies and Tracking Technologies</h3>
        <p>We use: (a) strictly necessary cookies (authentication, session management, security), (b) functional cookies (preferences, login state), (c) analytics cookies (Google Analytics), and (d) advertising and targeting cookies (Meta Pixel, LinkedIn Insight Tag, TikTok Pixel — which may constitute sharing for cross-context behavioral advertising under CCPA/CPRA).</p>
        <p>You may control cookies through your browser settings. You may also opt out of targeted advertising through: the Digital Advertising Alliance (optout.aboutads.info), Network Advertising Initiative (optout.networkadvertising.org), Google Analytics opt-out add-on, Meta ad preferences, or LinkedIn ad settings.</p>
        <p><span className="text-text-primary font-medium">Global Privacy Control:</span> We honor the GPC browser signal as an opt-out of the sale and sharing of personal information for California residents, as required under CPRA.</p>
      </section>

      {/* Section 7 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 7. Data Retention</h3>
        <p>We retain personal information as follows:</p>
        <ul className="space-y-1 pl-4 list-none">
          {[
            "Active account data: retained for the duration of your account and up to 12 months following account deletion.",
            "Billing and transaction records: retained for 7 years for accounting, tax, and legal compliance.",
            "Diagnostic Tool submissions (non-customers): retained for a maximum of 12 months from submission date.",
            "Diagnostic Tool data (customers): subject to the active account retention standard.",
            "Website scan data: retained for the same period as your diagnostic submission.",
            "Marketing contact records: retained until you unsubscribe, removed within 10 business days.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span className="text-text-muted shrink-0">({String.fromCharCode(97 + i)})</span><span>{item}</span></li>
          ))}
        </ul>
        <p>You may request deletion of your personal information at any time as described in Section 9.</p>
      </section>

      {/* Section 8 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 8. Data Security</h3>
        <p>We implement reasonable administrative, technical, and physical safeguards including: encryption of data in transit, secure cloud infrastructure with access controls and audit logging, role-based access controls, OAuth-based authentication, and regular security monitoring.</p>
        <p>No method of transmission or storage is completely secure. In the event of a data breach affecting your personal information, we will notify you as required by applicable law.</p>
      </section>

      {/* Section 9 */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Section 9. Your Privacy Rights</h3>
        <p>We do not discriminate against you for exercising any of these rights.</p>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">9.01 — All Users</p>
          <p>Regardless of your state of residence, you have the right to: (a) Access your personal information, (b) Correction of inaccurate information, (c) Deletion of your personal information, (d) Opt out of marketing at any time via unsubscribe links, and (e) Human review of any automated diagnostic assessment you believe is inaccurate.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">9.02 — California Residents (CCPA/CPRA)</p>
          <p>California residents have additional rights including: Right to Know (up to twice per 12-month period), Right to Delete, Right to Correct, Right to Opt Out of Sale and Sharing (our use of advertising pixels may constitute sharing under CPRA — click &quot;Do Not Sell or Share My Personal Information&quot; at the bottom of our website or contact us), Right to Limit Use of Sensitive Personal Information (not applicable as we do not collect sensitive PI), and Right to Non-Discrimination.</p>
          <p>We will respond to verified requests within 45 days (with a possible additional 45-day extension with notice).</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">9.03 — Other State Residents</p>
          <p>Residents of Virginia, Colorado, Connecticut, Utah, Texas, Montana, Oregon, Delaware, New Hampshire, New Jersey, Iowa, Nebraska, Indiana, Tennessee, Minnesota, and Maryland have rights under their applicable state privacy laws including access, correction, deletion, portability, opt-out of targeted advertising/sale/profiling, and the right to appeal our decisions. We honor these rights regardless of specific business-size thresholds.</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text-primary text-xs uppercase tracking-wider">9.04 — Opt Out of Cross-Context Behavioral Advertising</p>
          <p>To opt out: (a) Contact us at <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a> with subject line &quot;Opt Out of Sharing,&quot; (b) Enable Global Privacy Control in your browser, or (c) Use the opt-out tools listed in Section 6.</p>
        </div>
      </section>

      {/* Section 10 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 10. Email Communications and CAN-SPAM Compliance</h3>
        <p>We send transactional emails (account confirmations, billing notifications — not subject to opt-out) and commercial/marketing emails (promotional offers, product updates, diagnostic follow-ups — subject to CAN-SPAM requirements).</p>
        <p>In compliance with the CAN-SPAM Act: every commercial email identifies the sender, includes an accurate subject line, includes a physical mailing address for Bare Branding Systems, and includes an unsubscribe mechanism. We process opt-out requests within 10 business days.</p>
        <p>If you submit the Business Diagnostic Tool, you will receive email communications about your results and Autom8 products. You may opt out at any time using the unsubscribe link.</p>
      </section>

      {/* Section 11 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 11. Children&apos;s Privacy — COPPA Compliance</h3>
        <p>The Autom8 Platform and the Business Diagnostic Tool are not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such information, we will delete it promptly.</p>
        <p>If you are a parent or guardian and believe your child under 13 has submitted personal information to us, contact us at <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a>.</p>
      </section>

      {/* Section 12 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 12. International Data Transfers</h3>
        <p>Autom8ig is based in the United States. If you access our products from outside the United States, your personal information will be transferred to and processed in the United States, where privacy laws may differ from those in your country.</p>
        <p>For users in the EEA, UK, or Switzerland, transfers are made pursuant to appropriate safeguards including standard contractual clauses approved by the European Commission.</p>
      </section>

      {/* Section 13 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 13. Third-Party Services and Links</h3>
        <p>Our website and products may contain links to third-party websites and services. We are not responsible for the privacy practices or content of any third-party service. Social media platforms you connect via OAuth are governed by their own terms and privacy policies.</p>
      </section>

      {/* Section 14 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 14. Account Disconnection and Data Deletion</h3>
        <p><span className="text-text-primary font-medium">14.01 Disconnecting Social Media:</span> You may disconnect any social media account at any time through your account settings. We will revoke the OAuth access token and cease accessing that account&apos;s data.</p>
        <p><span className="text-text-primary font-medium">14.02 Account Deletion:</span> Request deletion of your Autom8 account by contacting <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a>.</p>
        <p><span className="text-text-primary font-medium">14.03 Diagnostic Submissions:</span> To delete a diagnostic submission, contact <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a> with subject line &quot;Delete Diagnostic Submission&quot; and the email you used. We will process your request within 30 days.</p>
      </section>

      {/* Section 15 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 15. Do Not Sell or Share My Personal Information</h3>
        <p>We do not sell your personal information. However, our use of certain tracking and advertising technologies (Meta Pixel, LinkedIn Insight Tag, TikTok Pixel) may constitute sharing for cross-context behavioral advertising under CPRA and similar state laws.</p>
        <p>To opt out: (a) Contact <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a> with subject line &quot;Do Not Sell or Share My Personal Information,&quot; (b) Enable Global Privacy Control in your browser, or (c) Use the advertising opt-out tools in Section 6. We will process your request within 15 business days.</p>
      </section>

      {/* Section 16 */}
      <section className="space-y-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 16. Changes to This Privacy Policy</h3>
        <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the Last Updated date and, where appropriate, notify you by email or prominent notice on our website. Your continued use of our products after a policy update constitutes your acceptance.</p>
      </section>

      {/* Section 17 */}
      <section className="space-y-2 pb-2">
        <h3 className="font-semibold text-text-primary text-sm">Section 17. Contact Information</h3>
        <p>For questions, to exercise privacy rights, or for any privacy-related inquiry:</p>
        <div className="rounded-xl bg-surface border border-border px-4 py-3 space-y-0.5 text-xs">
          <p className="font-medium text-text-primary">Bare Branding Systems / Autom8ig.io</p>
          <p>Email: <a href="mailto:hello@barebranding.site" className="text-primary hover:underline">hello@barebranding.site</a></p>
          <p>Subject line for privacy requests: &quot;Privacy Request&quot;</p>
        </div>
        <p>We will respond to all verified privacy requests within the timeframes required by applicable law, and in no event later than 45 days from receipt of a verified request.</p>
        <p>California residents unsatisfied with our response may contact the California Privacy Protection Agency at cppa.ca.gov.</p>
      </section>

      {/* Appendix A */}
      <section className="space-y-3">
        <h3 className="font-semibold text-text-primary text-sm">Appendix A. Summary of Rights by State</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["State", "Law", "Access", "Correct", "Delete", "Portability", "Opt Out Ads", "Opt Out Sale", "Appeal"].map(h => (
                  <th key={h} className="text-left py-2 pr-3 text-text-muted font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                ["California","CCPA/CPRA","✓","✓","✓","✓","✓","✓","✓"],
                ["Virginia","CDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Colorado","CPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Connecticut","CTDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Utah","UCPA","✓","—","✓","✓","✓","✓","—"],
                ["Texas","TDPSA","✓","✓","✓","✓","✓","✓","✓"],
                ["Montana","MCDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Oregon","OCPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Delaware","DPDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["New Hampshire","NHPA","✓","✓","✓","✓","✓","✓","✓"],
                ["New Jersey","NJDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Iowa","ICDPA","✓","—","✓","✓","—","✓","—"],
                ["Nebraska","NDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Indiana","INCDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Tennessee","TIPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Minnesota","MCDPA","✓","✓","✓","✓","✓","✓","✓"],
                ["Maryland","MODPA","✓","✓","✓","✓","✓","✓","✓"],
              ].map(row => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} className={`py-1.5 pr-3 whitespace-nowrap ${i === 0 ? "text-text-primary font-medium" : cell === "✓" ? "text-green-400" : "text-text-muted"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Appendix B */}
      <section className="space-y-3 pb-4">
        <h3 className="font-semibold text-text-primary text-sm">Appendix B. Categories of Personal Information — CCPA/CPRA Disclosure</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Category","Collected","Business Purpose","Shared With"].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                ["Identifiers","Yes","Service delivery, communications, security","Cloud providers, CRM, analytics"],
                ["Payment information","Yes","Transaction processing","Payment processors"],
                ["Internet activity","Yes","Product improvement, analytics, security","Analytics providers"],
                ["Professional information","Yes","Diagnostic analysis, sales qualification","CRM, sales tools"],
                ["Geolocation (approx.)","Yes","Analytics, fraud prevention","Analytics providers"],
                ["Inferences","Yes","Sales qualification, product recommendations","CRM, sales team"],
                ["Sensitive personal info","No","N/A","N/A"],
              ].map(row => (
                <tr key={row[0]}>
                  <td className="py-1.5 pr-4 text-text-primary font-medium">{row[0]}</td>
                  <td className={`py-1.5 pr-4 ${row[1] === "Yes" ? "text-green-400" : "text-text-muted"}`}>{row[1]}</td>
                  <td className="py-1.5 pr-4 text-text-secondary">{row[2]}</td>
                  <td className="py-1.5 text-text-secondary">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
