'use client'

import { useState, useEffect, useRef } from "react";
import { ref, uploadBytesResumable } from "firebase/storage";
import { listAll, deleteObject } from 'firebase/storage';
import { storage } from "/utils/firebase";
import { IoCloudUploadOutline } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';
import { IoLogOutOutline } from 'react-icons/io5';
import { auth } from '/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

function getGreeting() {
    const hours = new Date().getHours();
    if (hours >= 0 && hours < 12) {
        return 'Good morning!';
    } else if (hours >= 12 && hours < 18) {
        return 'Good afternoon!';
    } else {
        return 'Good evening!';
    }
}

export default function Portal() {
    const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
    const greeting = getGreeting();
    const [uploads, setUploads] = useState([]);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const dropRef = useRef(null);

    useEffect(() => {
        // Check if the user is authenticated
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // If the user is not authenticated, redirect to login page
                router.push('/');
            } else {
                setIsAuthCheckComplete(true);
            }
        });
    }, []);

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
    }, uploads);

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
            const newUpload = {
                file: selectedFile,
                progress: 0,
                completed: false
            };
            setUploads(prevUploads => [...prevUploads, newUpload]);
            handleSubmit(newUpload);
        } else {
            setError("Please upload a valid PDF file.");
        }
    };

    const handleSubmit = (uploadItem) => {
        if (!uploadItem) {
            console.log("No file provided to handleSubmit");
            return;
        }
    
        // Check for existing file
        const existingFile = files.find(f => f.name === uploadItem.file.name);
        if (existingFile) {
            const replace = window.confirm("File already uploaded. Do you want to replace it?");
            if (!replace) return;
        }

        setError(null);
        
        const storageRef = ref(storage, `pdfs/${uploadItem.file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, uploadItem.file);

        // Track progress of the upload
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploads(prevUploads => prevUploads.map(item => {
                    if (item.file.name === uploadItem.file.name) {
                        return { ...item, progress: progressValue };
                    }
                    return item;
                }));
            }, 
            (error) => {
                console.error("Firebase upload error:", error);
                setError(error.message);
            },
            () => {
                setUploads(prevUploads => prevUploads.map(item => {
                    if (item.file.name === uploadItem.file.name) {
                        return { ...item, completed: true };
                    }
                    return item;
                }));
            }
        );
    };

    useEffect(() => {
        const dropArea = dropRef.current;
        
        if (!dropArea) return; // Exit if dropArea is not yet available
    
        const handleDragOver = (e) => {
            e.preventDefault();
        };
    
        const handleDrop = (e) => {
            e.preventDefault();
            // ... rest of the code in this function
        };
    
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('drop', handleDrop);
    
        return () => {
            dropArea.removeEventListener('dragover', handleDragOver);
            dropArea.removeEventListener('drop', handleDrop);
        };
    }, []);
    
    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/');
            console.log('Logged out successfully');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }

    // Do not render the page until the auth check is complete
    if (!isAuthCheckComplete) {
        return null;
    }

    return (
        <div className="min-h-screen w-full grid grid-cols-3 bg-gray-100 p-4">
            <div className="font-sans italic absolute top-10 left-10 text-2xl text-zinc-600">
                {greeting}
            </div>
            <button onClick={handleLogout} className="absolute bottom-5 left-5 bg-zinc-600 p-2 rounded-full hover:bg-red-500 hover:text-white transition duration-300 ease-in-out">
                <IoLogOutOutline size={24} />
            </button>
            <div className="w-2/4 h-2/4 flex flex-col col-span-2 self-center justify-self-center">
                <div className="flex flex-col h-full justify-center">
                    <h1 className="flex flex-col text-2xl font-sans font-semibold mb-8 text-zinc-600 self-center">Upload a PDF <b></b> <p className="text-sm text-zinc-400 font-normal self-center pt-1">File should be .pdf</p></h1>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    {/* Drag and Drop Area */}
                    <div
                        ref={dropRef}
                        className="flex h-full border-2 bg-slate-100 border-slate-400 p-10 rounded-md mb-4 justify-center cursor-pointer relative">
                        <input
                            type="file"
                            id="pdf"
                            name="pdf"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center">
                            <IoCloudUploadOutline className="text-slate-400 mb-2" size={58} />
                            <p className="text-sm text-center text-zinc-400 font-sans">Drag & drop or click to upload</p>
                        </div>
                    </div>

                    {/* Progress Bar and File Details */}
                    <div className="mb-4">
                        {uploads.length > 0 ? <h1 className="text-l font-sans text-zinc-400 pt-4 pb-4">Uploaded files</h1> : <></>}
                        <div className="mb-4 overflow-y-auto" style={{ maxHeight: "300px" }}>
                            {uploads.map((upload, idx) => (
                                <div className="pt-3" key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-sans text-m text-zinc-600 truncate">
                                            {upload.file.name}
                                        </span>
                                        <div className="flex items-center">
                                            <span className="font-sans text-sm text-gray-400 mr-2">{Math.round(upload.progress)}%</span>
                                            {upload.completed && <FaCheck className="font-sans text-green-500" />}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded">
                                        <div className="h-full bg-blue-400 rounded" style={{ width: `${upload.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="fixed top-0 right-0 h-screen w-1/3 p-5 bg-secondary text-gray-600 shadow-xl">
                <div className="h-full w-full bg-white p-5 rounded-lg overflow-y-auto">
                    <h2 className="text-xl font-semibold font-sans mb-6 border-b pb-2">Uploaded PDFs</h2>
                    <ul className="divide-y divide-gray-200">
                        {files.length == 0 ? <span className="truncate text-zinc-400 font-sans italic">No files to display</span> : <></>}
                        {files.map(file => (
                            <li key={file.name} className="py-2 flex justify-between items-center">
                                <span className="truncate text-gray-800 font-sans">{file.name}</span>
                                <button onClick={() => handleDelete(file)} className="font-sans text-red-500 hover:text-red-600 hover:bg-red-100 px-2 py-1 rounded">
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
