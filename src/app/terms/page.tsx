import React from "react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-20 animate-in fade-in duration-1000">
      <div className="glass-card p-12 !rounded-[3rem] border-white/5 space-y-12 bg-black/40 backdrop-blur-3xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-black lilita-font tracking-tight text-white">Terms & Conditions</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest">Last updated on July 14, 2025</p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 font-medium leading-relaxed">
          <p>
            The Website Owner, including subsidiaries and affiliates (“Website” or “Website Owner” or “we” or “us” or “our”) provides the information contained on the website or any of the pages comprising the website (“website”) to visitors (“visitors”) (cumulatively referred to as “you” or “your” hereinafter) subject to the terms and conditions set out in these website terms and conditions, the privacy policy and any other relevant terms and conditions, policies and notices which may be applicable to a specific section or module of the website.
          </p>

          <p>
            Welcome to our website. If you continue to browse and use this website you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern FINITE LOOP CLUB&apos;s relationship with you in relation to this website.
          </p>

          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4">
            <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Critical Disclaimer: Usage Risk</h3>
            <p className="text-zinc-200 text-sm font-bold leading-relaxed italic">
              IMPORTANT: Usage of this platform is entirely at your own risk. The platform owners, developers, and Finite Loop Club members shall NOT be held responsible for any mis-sending of emails, server glitches, internal code errors, or data discrepancies. By using this tool, you acknowledge that automated bulk dispatch carries inherent risks and you accept full responsibility for any outcomes.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">1. Definitions</h2>
            <p>
              The term &apos;FINITE LOOP CLUB&apos; or &apos;us&apos; or &apos;we&apos; refers to the owner of the website whose registered/operational office is:<br />
              <span className="text-flc-orange font-bold">2-1-22, Bombay House, Kalsanka, Kunjibettu PO Udupi KARNATAKA 576102</span>
            </p>
            <p>The term &apos;you&apos; refers to the user or viewer of our website.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">2. Terms of Use</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>The content of the pages of this website is for your general information and use only. It is subject to change without notice.</li>
              <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
              <li>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.</li>
              <li>This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
              <li>All trademarks reproduced in this website which are not the property of, or licensed to, the operator are acknowledged on the website.</li>
              <li>Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offense.</li>
              <li>From time to time this website may also include links to other websites. These links are provided for your convenience to provide further information.</li>
              <li>You may not create a link to this website from another website or document without FINITE LOOP CLUB’s prior written consent.</li>
              <li>Your use of this website and any dispute arising out of such use of the website is subject to the laws of India or other regulatory authority.</li>
              <li>We as a merchant shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
