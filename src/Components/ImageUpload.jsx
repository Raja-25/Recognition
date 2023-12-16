import React, { useState, useRef } from 'react';
import { CloudinaryContext, Image } from 'cloudinary-react';
import Webcam from 'react-webcam';
import QRCode from 'qrcode.react';
import copy from 'copy-to-clipboard';
import AWS from 'aws-sdk';
import { useDropzone } from 'react-dropzone';
import './ImageUpload.css';
import { toast } from 'react-toastify';
const cloudinaryConfig = {
  cloudName: process.env.Rec_cloudName,
  apiKey: process.env.Rec_apiKey,
  apiSecret: process.env.Rec_apiSecret,
};

AWS.config.update({
  accessKeyId: process.env.Rec_accessKeyId,
  secretAccessKey:  process.env.Rec_secretAccessKey,
  region:  process.env.Rec_region,
});


const rekognition = new AWS.Rekognition();

const CloudinaryUpload = async (file) => {
  try {
    if (file.type === 'image/jpeg' || file.type === 'image/png') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'recognition');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      toast.success('Image uploaded successfully');
      const data = await response.json();
      return data.secure_url;
    } else {
      toast.error('Wrong file type');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default function ImageUpload() {
  const [uploadedImage, setUploadedImage] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [text, setText] = useState();
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

  const handleCaptureAndUpload = async () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const uploadedUrl = await CloudinaryUpload(blob);
      setUploadedImage(uploadedUrl);
      console.log(qrCodeDataUrl);
    } catch (error) {
      console.error('Error capturing and uploading image:', error);
    }
  };

  const stopCamera = () => {
    const videoTrack = webcamRef.current.video.srcObject.getVideoTracks()[0];
    videoTrack.stop();
    toast.success('Camera stopped successfully');
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

  const getImageBytes = async (imageUrl) => {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  async function facialAnalysis() {
    try {
      const rekognitionParams = {
        Image: {
          Bytes: await getImageBytes(uploadedImage),
        },
        Attributes: ['ALL'],
      };

      console.log('Sending To Rekog');
      const data = await rekognition.detectFaces(rekognitionParams).promise();

      // Extract desired attributes from the detected faces
      const faceDetails = data.FaceDetails.map((faceDetail) => ({
        emotions: faceDetail.Emotions.map((emotion) => ({
          type: emotion.Type,
          confidence: emotion.Confidence,
        })),
        glasses: faceDetail.Eyeglasses.Value,
        sunglasses: faceDetail.Sunglasses.Value,
        gender: faceDetail.Gender.Value,
        smile: faceDetail.Smile.Value,
        ageRange: {
          low: faceDetail.AgeRange.Low,
          high: faceDetail.AgeRange.High,
        },
      }));

      console.log('Face details:', faceDetails);
      // Handle the face details data as needed
      setText(faceDetails);
      const arr = faceDetails[0];
      console.log("facedetails",arr);
      console.log(text , '1234567');
    } catch (error) {
      console.error(error);
    }
  }

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
              <button className="btn btn-primary" onClick={facialAnalysis}>
                Get Facial Analysis
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
        <div className="row dropclass">
          <div className="col-md-6 mt-3">
            {/* Dropzone */}
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              <i className="fa-regular fa-download"></i>
              <p>Drag 'n' drop an image here, or click to select one</p>
            </div>
          </div>
        </div>
      </div>
    </CloudinaryContext>
  );
}
