import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 inline-block">&larr; Back to FamiliMatch</Link>
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>FamiliMatch uses AI-powered facial analysis to compare faces. Your photos are processed in real-time and are not stored on our servers after the comparison is complete.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Biometric Data</h2>
        <p>With your explicit consent (BIPA), we extract facial feature embeddings for comparison purposes only. These embeddings are discarded after your session ends and are never sold or shared with third parties.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Local Storage</h2>
        <p>We store your consent preferences and recent match history in your browser's local storage. You can clear this data at any time through your browser settings.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Analytics</h2>
        <p>We collect anonymised usage analytics to improve the product. Analytics are only collected after you grant consent. No personally identifiable information is included in analytics events.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Contact</h2>
        <p>For privacy enquiries, contact <a href="mailto:privacy@famililook.com" className="text-blue-400 hover:underline">privacy@famililook.com</a>.</p>
      </div>
    </div>
  );
}
