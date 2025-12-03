import { useState, useEffect } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pdfs');
      setPdfs(response.data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setMessage('');
    } else {
      setMessage('⚠️ Please select a PDF file only!');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('⚠️ Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    setUploading(true);
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/upload', formData);
      setMessage('✅ PDF uploaded successfully!');
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      fetchPdfs();
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleViewPdf = (pdf) => {
    const pdfUrl = `http://localhost:5000/uploads/${pdf.filepath}`;
    console.log('📄 PDF URL:', pdfUrl);
    setViewingPdf(pdfUrl);
    setPageNumber(1);
  };

  const handleClosePdf = () => {
    setViewingPdf(null);
    setNumPages(null);
    setPageNumber(1);
  };

  const handleDelete = async (pdfId, event) => {
    event.stopPropagation(); // Prevent triggering view on click
    
    if (!confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    setDeleting(pdfId);
    try {
      await axios.delete(`http://localhost:5000/api/pdf/${pdfId}`);
      setMessage('✅ PDF deleted successfully!');
      
      // If viewing the deleted PDF, close viewer
      if (viewingPdf && pdfs.find(p => p._id === pdfId)) {
        handleClosePdf();
      }
      
      fetchPdfs();
    } catch (error) {
      setMessage('❌ Error deleting PDF: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            📄 PDF Reader
          </h1>
          <p className="text-gray-600">Upload, View & Manage Your PDFs</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📤</span> Upload PDF
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className={`px-8 py-2 rounded-lg font-semibold text-white transition-all transform ${
                uploading || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md'
              }`}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg font-medium ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar - PDF List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📚</span> Your PDFs ({pdfs.length})
              </h2>
              
              {pdfs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📂</div>
                  <p className="text-gray-500">No PDFs yet</p>
                  <p className="text-sm text-gray-400 mt-2">Upload your first PDF to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {pdfs.map((pdf) => (
                    <div
                      key={pdf._id}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 transition-all hover:shadow-md hover:border-blue-400 relative group"
                    >
                      <div 
                        onClick={() => handleViewPdf(pdf)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">
                              {pdf.filename}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              📅 {new Date(pdf.uploadDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              💾 {(pdf.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(pdf._id, e)}
                        disabled={deleting === pdf._id}
                        className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                          deleting === pdf._id
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete PDF"
                      >
                        {deleting === pdf._id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main - PDF Viewer */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>👁️</span> PDF Viewer
                </h2>
                
                {/* Back Button */}
                {viewingPdf && (
                  <button
                    onClick={handleClosePdf}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    ← Back to List
                  </button>
                )}
              </div>

              {viewingPdf ? (
                <>
                  {/* Navigation Controls */}
                  <div className="bg-gray-800 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                    <button
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        pageNumber <= 1
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    <div className="text-center">
                      <p className="font-bold text-lg">
                        Page {pageNumber} of {numPages || '?'}
                      </p>
                    </div>

                    <button
                      onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
                      disabled={pageNumber >= numPages}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        pageNumber >= numPages
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>

                  {/* PDF Display */}
                  <div className="bg-gray-600 p-6 flex justify-center items-center min-h-[700px]">
                    <Document
                      file={viewingPdf}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="text-white text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                          <p className="text-lg">Loading PDF...</p>
                        </div>
                      }
                      error={
                        <div className="text-red-300 text-center">
                          <p className="text-4xl mb-4">❌</p>
                          <p className="text-lg">Failed to load PDF</p>
                          <button
                            onClick={handleClosePdf}
                            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                          >
                            Go Back
                          </button>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={Math.min(window.innerWidth - 100, 800)}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-2xl"
                      />
                    </Document>
                  </div>
                </>
              ) : (
                <div className="p-20 text-center bg-gray-50">
                  <div className="text-8xl mb-6">📂</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    No PDF Selected
                  </h3>
                  <p className="text-gray-500">
                    Click on a PDF from the list to view it here
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-700 font-semibold mb-2">
              Made with ❤️ by <span className="text-blue-600">Rohit</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              PDF Reader App - Upload, View & Manage PDFs Easily
            </p>
            
            {/* Social Links */}
            <div className="flex justify-center gap-4">
              <a
                href="https://github.com/Pr-Rajput-Rohit1612"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>💻</span> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/rohit-tanwar-rs1612?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>🔗</span> LinkedIn
              </a>
              
            </div>
    <span><h1 className='font-extrabold'>  create your Portfolio here</h1></span>
    <span> <a
                href="https://yourportfolio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 align-items-center justify-center"
              >
      <span className='items-center justify-center'>🌐</span>  Portfolio generator
    </a> </span>
            
            <p className="text-xs text-gray-400 mt-4">
              © 2025 PDF Reader. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;