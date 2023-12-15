import React, { useState, useRef } from 'react';
import { CloudinaryContext, Image } from 'cloudinary-react';
import Webcam from 'react-webcam';
import QRCode from 'qrcode.react';
import copy from 'copy-to-clipboard';
import { useDropzone } from 'react-dropzone';
import "./ImageUpload.css";
const cloudinaryConfig = {
  cloudName: 'dwu6zg8lc',
  apiKey: '417519479118346',
  apiSecret: 'pP2gWfIa68JTgMJaI7I27xGYe1w',
};

const CloudinaryUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'recognition');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default function ImageUpload() {
  const [uploadedImage, setUploadedImage] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const webcamRef = useRef(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      try {
        const uploadedUrl = await CloudinaryUpload(acceptedFiles[0]);
        setUploadedImage(uploadedUrl);
      } catch (error) {
        console.error('Error uploading dropped image:', error);
      }
    },
  });

  // Reusable function for capturing screenshot and uploading to Cloudinary
  const handleCaptureAndUpload = async () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const uploadedUrl = await CloudinaryUpload(blob);
      setUploadedImage(uploadedUrl);
      console.log(qrCodeDataUrl)
    } catch (error) {
      console.error('Error capturing and uploading image:', error);
    }
  };

  const stopCamera = () => {
    const videoTrack = webcamRef.current.video.srcObject.getVideoTracks()[0];
    videoTrack.stop();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamRef.current.video.srcObject = stream;
    } catch (error) {
      console.error('Error starting the camera:', error);
    }
  };

  const captureScreenshot = () => {
    handleCaptureAndUpload();
    stopCamera();
  };

  const downloadQrCode = () => {
    try {
      const qrCodeCanvas = document.getElementById('qrCodeCanvas');
      const qrCodeDataUrl = qrCodeCanvas.toDataURL('image/png');
      setQrCodeDataUrl(qrCodeDataUrl);

      const downloadLink = document.createElement('a');
      downloadLink.href = qrCodeDataUrl;
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const copyurl = () => {
    copy(uploadedImage);
  };

  return (
    <CloudinaryContext {...cloudinaryConfig}>
      <div className="container mt-4 imageupload">
        <div className="row">
          <div className="col-md-6">
            {/* Webcam */}
            <Webcam ref={webcamRef} screenshotFormat="image/png" mirrored={true} width={450} className="img-fluid" />
            <div className="mt-3">
              <button className="btn btn-primary" onClick={captureScreenshot}>
                Capture Screenshot
              </button>
              <button className="btn btn-success mx-2" onClick={startCamera}>
                Start Camera
              </button>
              <button className="btn btn-danger" onClick={stopCamera}>
                Stop Camera
              </button>
            </div>
          </div>

          {uploadedImage && (
            <div className="col-md-6 mt-3">
              <div className="row">
                <div className="col-6">
                  <p className="fs-5">Uploaded Image:</p>
                  <Image publicId={uploadedImage} className="img-fluid" />
                </div>
                <div className="col-6">
                  <p className="fs-5">Image QRcode:</p>
                  <QRCode value={uploadedImage} id="qrCodeCanvas" className="img-fluid" />
                  <button className="btn btn-primary mt-3 me-4" onClick={downloadQrCode}>
                    Download QR Code
                  </button>
                </div>
              </div>
              <div className="row mt-5">
                <div className="input-group mb-3">
                  <input type="text" className="form-control" value={uploadedImage} readOnly />
                  <button className="input-group-text" onClick={copyurl}>
                    <i className="fa-regular fa-clipboard fa-bounce"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="row dropclass" >
          <div className="col-md-6 mt-3">
            {/* Dropzone */}
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              <i class="fa-regular fa-download"></i>
              <p>Drag 'n' drop an image here, or click to select one  </p>
            </div>
          </div>
        </div>
      </div>
    </CloudinaryContext>
  );
}
