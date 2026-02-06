'use client';

import { useState, useCallback } from 'react';
import type { Deck, Organization, DonorUpload } from '@/db/schema';

interface DonorUploadFormProps {
  baseDecks: Deck[];
  organizations: Organization[];
  previousUploads: DonorUpload[];
}

interface ParsedDonor {
  name: string;
  email?: string;
  amount?: string;
}

export function DonorUploadForm({ baseDecks, organizations, previousUploads }: DonorUploadFormProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(baseDecks[0]?.id || null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedDonors, setParsedDonors] = useState<ParsedDonor[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ uploadId: number; donorCount: number } | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setParsedDonors([]);

    // Parse CSV preview
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setError('CSV must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h === 'name' || h === 'donor_name' || h === 'full_name');
      const emailIndex = headers.findIndex(h => h === 'email' || h === 'donor_email');
      const amountIndex = headers.findIndex(h => h === 'amount' || h === 'donation_amount' || h === 'gift_amount');

      if (nameIndex === -1) {
        setError('CSV must have a "name" column');
        return;
      }

      const donors: ParsedDonor[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        donors.push({
          name: cols[nameIndex] || '',
          email: emailIndex !== -1 ? cols[emailIndex] : undefined,
          amount: amountIndex !== -1 ? cols[amountIndex] : undefined,
        });
      }

      setParsedDonors(donors);
    } catch {
      setError('Failed to parse CSV file');
    }
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedDeckId) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('baseDeckId', selectedDeckId.toString());

      const response = await fetch('/api/donors/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess({
        uploadId: data.uploadId,
        donorCount: data.donorCount,
      });
      setFile(null);
      setParsedDonors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const selectedDeck = baseDecks.find(d => d.id === selectedDeckId);
  const org = selectedDeck ? organizations.find(o => o.id === selectedDeck.organizationId) : null;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-green-100 rounded-full text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">Upload Started!</h3>
              <p className="text-green-700 text-sm mb-3">
                We're generating {success.donorCount} personalized thank-you decks. This may take a few minutes.
              </p>
              <a
                href={`/api/donors/download/${success.uploadId}`}
                className="text-sm font-medium text-green-700 hover:underline"
              >
                Download results when ready →
              </a>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-neutral-800 mb-4">Upload Donor List</h2>

        {/* Base Deck Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Base Deck
          </label>
          <select
            value={selectedDeckId || ''}
            onChange={(e) => setSelectedDeckId(Number(e.target.value))}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#C15A36] focus:border-transparent"
          >
            {baseDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.orgName} - Impact Deck
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            Personalized decks will be based on this deck's design and content.
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            CSV File
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? 'border-green-300 bg-green-50' : 'border-neutral-200 hover:border-[#C15A36]/50'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="font-medium text-green-700">{file.name}</span>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-neutral-400">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" x2="12" y1="3" y2="15"/>
                  </svg>
                  <p className="text-neutral-600 font-medium">Drop a CSV file here or click to upload</p>
                  <p className="text-neutral-400 text-sm mt-1">Must include a "name" column</p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        {parsedDonors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Preview (first 5 rows)</h3>
            <div className="bg-neutral-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-neutral-600">Name</th>
                    <th className="px-4 py-2 text-left text-neutral-600">Email</th>
                    <th className="px-4 py-2 text-left text-neutral-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedDonors.map((donor, i) => (
                    <tr key={i} className="border-t border-neutral-200">
                      <td className="px-4 py-2 text-neutral-800">{donor.name || '-'}</td>
                      <td className="px-4 py-2 text-neutral-500">{donor.email || '-'}</td>
                      <td className="px-4 py-2 text-neutral-500">{donor.amount || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={!file || !selectedDeckId || uploading}
          className="w-full py-3 bg-[#C15A36] text-white rounded-lg font-semibold hover:bg-[#a84d2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Processing...' : 'Generate Personalized Decks'}
        </button>
      </div>

      {/* Previous Uploads */}
      {previousUploads.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">Previous Uploads</h2>
          <div className="space-y-3">
            {previousUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div>
                  <div className="font-medium text-neutral-800">{upload.fileName}</div>
                  <div className="text-sm text-neutral-500">
                    {upload.donorCount} donors • {new Date(upload.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    upload.status === 'complete' ? 'bg-green-100 text-green-700' :
                    upload.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {upload.status === 'complete' ? 'Complete' :
                     upload.status === 'failed' ? 'Failed' :
                     `${upload.processedCount}/${upload.donorCount}`}
                  </span>
                  {upload.status === 'complete' && upload.resultsCsvUrl && (
                    <a
                      href={upload.resultsCsvUrl}
                      className="text-[#C15A36] hover:underline text-sm font-medium"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Format Info */}
      <div className="bg-neutral-50 rounded-xl p-6">
        <h3 className="font-semibold text-neutral-800 mb-3">CSV Format</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Your CSV should have at least a <code className="bg-neutral-200 px-1 rounded">name</code> column.
          Optional columns include <code className="bg-neutral-200 px-1 rounded">email</code> and <code className="bg-neutral-200 px-1 rounded">amount</code>.
        </p>
        <div className="bg-white rounded-lg p-4 font-mono text-xs text-neutral-600 overflow-x-auto">
          <div>name,email,amount</div>
          <div>John Smith,john@example.com,$500</div>
          <div>Sarah Johnson,sarah@example.com,$1000</div>
          <div>Michael Brown,michael@example.com,$250</div>
        </div>
      </div>
    </div>
  );
}
