import React from "react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-20 animate-in fade-in duration-1000">
      <div className="glass-card p-12 !rounded-[3rem] border-white/5 space-y-12 bg-black/40 backdrop-blur-3xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-black lilita-font tracking-tight text-white">Privacy Policy</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest">Last updated on July 14, 2025</p>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 font-medium leading-relaxed">
          <p>
            This privacy policy sets out how <span className="text-flc-orange font-bold">FINITE LOOP CLUB</span> uses and protects any information that you give FINITE LOOP CLUB when you use this website.
          </p>

          <p>
            FINITE LOOP CLUB is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, and then you can be assured that it will only be used in accordance with this privacy statement.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and job title</li>
              <li>Contact information including email address</li>
              <li>Demographic information such as postcode, preferences and interests</li>
              <li>Other information relevant to customer surveys and/or offers</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">What We Do With Information</h2>
            <p>We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Internal record keeping</li>
              <li>Improving our products and services</li>
              <li>Periodically sending promotional emails about new products or special offers</li>
              <li>Contacting you for market research purposes</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">Security</h2>
            <p>
              We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure we have put in suitable measures.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">How We Use Cookies</h2>
            <p>
              A cookie is a small file which asks permission to be placed on your computer&apos;s hard drive. Once you agree, the file is added and the cookie helps analyse web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual.
            </p>
            <p>
              We use traffic log cookies to identify which pages are being used. This helps us analyse data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">Controlling Your Personal Information</h2>
            <p>
              We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
            </p>
            <p>
              If you believe that any information we are holding on you is incorrect or incomplete, please write to or email us as soon as possible. We will promptly correct any information found to be incorrect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
