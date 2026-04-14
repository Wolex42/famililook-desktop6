import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 inline-block">&larr; Back to FamiliMatch</Link>
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>By using FamiliMatch, you agree to these terms. FamiliMatch is an entertainment product that uses AI to compare facial features between people.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Accuracy</h2>
        <p>FamiliMatch results are for entertainment purposes only and should not be used for identification, verification, or any legal purpose. Results are AI-generated approximations and do not constitute scientific or medical analysis.</p>
        <h2 className="text-lg font-semibold text-white mt-6">User Content</h2>
        <p>You must have the right to upload any photos you submit. Do not upload photos of people without their consent. Photos of children under 13 require parental consent.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Acceptable Use</h2>
        <p>You agree not to use FamiliMatch for harassment, discrimination, or any unlawful purpose. We reserve the right to terminate access for violations.</p>
        <h2 className="text-lg font-semibold text-white mt-6">Contact</h2>
        <p>For enquiries, contact <a href="mailto:support@famililook.com" className="text-blue-400 hover:underline">support@famililook.com</a>.</p>
      </div>
    </div>
  );
}
