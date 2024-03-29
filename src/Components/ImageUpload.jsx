import React, { useState, useRef } from 'react';
import { CloudinaryContext, Image } from 'cloudinary-react';
import Webcam from 'react-webcam';
import QRCode from 'qrcode.react';
import copy from 'copy-to-clipboard';
import AWS from 'aws-sdk';
import { useDropzone } from 'react-dropzone';
import './ImageUpload.css';
import { toast } from 'react-toastify';
import Loader from "./Loader"
const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_Cloud_Name,
  apiKey: process.env.REACT_APP_Api_Key,
  apiSecret: process.env.REACT_APP_Api_Secret,
};

AWS.config.update({
  accessKeyId: process.env.REACT_APP_Access_Key_Id,
  secretAccessKey: process.env.REACT_APP_Secret_Access_Key,
  region: process.env.REACT_APP_region,
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
  const [details, setDetails] = useState();
  const webcamRef = useRef(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      try {


        const uploadedUrl = await CloudinaryUpload(acceptedFiles[0]);
        setUploadedImage(uploadedUrl);
      } catch (error) {
        console.error('Error uploading dropped image:', error);
        toast.error("Error capturing and uploading image")
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
      toast.error("Error capturing and uploading image")
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
      toast.error("Error starting the camera")
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
      toast.error("Error downloading QR code")
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
      setDetails(null);
      const rekognitionParams = {
        Image: {
          Bytes: await getImageBytes(uploadedImage),
        },
        Attributes: ['ALL'],
      };

      console.log('Sending To Rekog');
      const data = await rekognition.detectFaces(rekognitionParams).promise();



      // Extract desired attributes from the detected faces
      const faceDetails = data.FaceDetails.map((faceDetail) => {
        let maxConfidenceEmotion = { type: "", confidence: 0 };

        faceDetail.Emotions.forEach((emotion) => {
          if (emotion.Confidence > maxConfidenceEmotion.confidence) {
            maxConfidenceEmotion.type = emotion.Type;
            maxConfidenceEmotion.confidence = emotion.Confidence;
          }
        });

        return {
          emotions: maxConfidenceEmotion,
          glasses: faceDetail.Eyeglasses.Value,
          sunglasses: faceDetail.Sunglasses.Value,
          gender: faceDetail.Gender.Value,
          smile: faceDetail.Smile.Value,
          ageRange: {
            low: faceDetail.AgeRange.Low,
            high: faceDetail.AgeRange.High,
          },
        };
      });


      console.log('Face details:', faceDetails);
      const att = faceDetails[0];
      setDetails(att);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CloudinaryContext {...cloudinaryConfig}>
      <div className="container  imageupload" >
        <div className="webcam-container">
          {/* Webcam */}
          <Webcam ref={webcamRef} screenshotFormat="image/png" mirrored={true} className="webcam" />
          <div className="mt-3">
            <table >
              <tr>
                <td>
                  <button className="btn btn-primary" onClick={captureScreenshot}>
                    Capture Screenshot
                  </button>
                </td>
                <td>
                  <button className="btn btn-success " onClick={startCamera}>
                    Start Camera
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <button className="btn btn-danger" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </td>
                <td>
                  <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop" onClick={facialAnalysis}>
                    Get Facial Analysis
                  </button>
                </td>
              </tr>
            </table>
          </div>
        </div>
        <div className="image-container">
          {uploadedImage && (
            <div className="image-details">
              <div className="uploaded-image">

                <Image publicId={uploadedImage} className="uploadedimagecontainer" />
              </div>
              <div className="qr-code">
                <QRCode value={uploadedImage} id="qrCodeCanvas" className="img-fluid" />
                <button className="btn btn-primary mt-3 me-4" onClick={downloadQrCode}>
                  Download QR Code
                </button>
              </div>
              <div className="copyurl">
                <div className="input-group ">
                  <input type="details" className="form-control" value={uploadedImage} readOnly />
                  <button className="input-group-details" onClick={copyurl}>
                    <i className="fa-regular fa-clipboard fa-bounce"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="dropzone-container">
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <i className="fa-regular fa-download"></i>
            <p>Drag 'n' drop an image here, or click to select one </p>
            <p>Upload Either jpeg or png</p>
          </div>
        </div>
        <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="staticBackdropLabel">Recognition of Emotion</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {details ? (
                  <table className="table table-hover">
                    <tbody>

                      <tr >
                        <td>

                          <strong>Emotion:</strong> {details.emotions.type} <br />
                          <strong>Confidence:</strong> {details.emotions.confidence} <br />
                          <strong>Glasses:</strong> {details.glasses === true ? "Glasses are Present" : "No glasses"} <br />
                          <strong>Sunglasses:</strong> {details.sunglasses === true ? "SunGlasses are Present" : "No Sunglasses"} <br />
                          <strong>Gender:</strong> {details.gender} <br />
                          <strong>Smile:</strong> {details.smile === true ? "Smiling" : "Not Smiling"} <br />
                          <strong>Age Range:</strong> {details.ageRange.low} - {details.ageRange.high}


                        </td>
                      </tr>

                    </tbody>
                  </table>
                ) : <Loader />}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CloudinaryContext>

  );
}
