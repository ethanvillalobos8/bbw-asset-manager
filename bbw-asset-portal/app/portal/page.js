'use client'

import { useState, useEffect } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { listAll, deleteObject } from 'firebase/storage';
import { storage } from "/utils/firebase";

export default function Portal() {
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFiles = async () => {
            const storageRef = ref(storage, 'pdfs');
            try {
                const fileList = await listAll(storageRef);
                setFiles(fileList.items);
            } catch (err) {
                console.error("Error fetching files:", err);
            }
        };

        fetchFiles();
    }, []);

    const handleDelete = async (fileRef) => {
        try {
            await deleteObject(fileRef);
            // Update the file list after successful deletion
            setFiles(prevFiles => prevFiles.filter(file => file.fullPath !== fileRef.fullPath));
        } catch (err) {
            console.error("Error deleting file:", err);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else {
            setError("Please upload a valid PDF file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadSuccess(false);

        const storageRef = ref(storage, `pdfs/${file.name}`);

        // Set a timeout for the upload
        const uploadTimeout = setTimeout(() => {
            setUploading(false);
            setError("Upload is taking too long. If you're using a cloud service provider, please ensure all files are synced and downloaded.");
        }, 5000);

        try {
            await uploadBytes(storageRef, file);
            clearTimeout(uploadTimeout);  // Clear the timeout if upload is successful
            setUploadSuccess(true);
            setFile(null);
        } catch (err) {
            clearTimeout(uploadTimeout);  // Clear the timeout if there's an error
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-8 text-gray-600">Upload PDF</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {uploadSuccess && (
                <p className="text-green-500 mb-4">File uploaded successfully!</p>
            )}
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="mb-4">
                    <input
                        type="file"
                        id="pdf"
                        name="pdf"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full p-2 border rounded-md text-gray-600"
                    />
                </div>
                <div className="mb-4">
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full p-2 rounded-md ${uploading
                            ? "bg-gray-300"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </form>
            <div className="fixed top-0 right-0 h-screen w-48
                            flex flex-col
                            bg-secondary text-gray-600">
                <h2 className="text-xl font-bold mb-4">Uploaded PDFs</h2>
                <ul>
                    {files.map(file => (
                        <li key={file.name} className="mb-2 flex justify-between items-center">
                            <span className="truncate">{file.name}</span>
                            <button onClick={() => handleDelete(file)} className="text-red-500 hover:text-red-600">
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
