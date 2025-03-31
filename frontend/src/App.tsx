import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isReceiver, setIsReceiver] = useState(false);
  const [receivedChunks, setReceivedChunks] = useState<BlobPart[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const connectionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:3000');  //server url
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return; //early exits

    const urlParams = new URLSearchParams(window.location.search); //getting url
    const peerId = urlParams.get('peerId'); //getting peerId from url

    if (peerId) {
      //peerId found,sender disable and reciever enable
      setIsReceiver(true);

      // Emit the peer ID to the server
      socket.emit('peer-id', peerId);

      // Initialize Peer.js for the receiver
      const receiverPeer = new Peer();

      receiverPeer.on('open', (id) => {
        console.log('Receiver Peer ID:', id);

        // Connect to the sender
        const conn = receiverPeer.connect(peerId);
        connectionRef.current = conn;

        conn.on('open', () => {
          console.log('Connected to sender:', peerId);
          setIsDownloading(true);

          // Handle incoming data
          conn.on('data', (data: any) => {
            if (data.type === 'file-metadata') {
              setFileName(data.metadata.name);
              console.log('Receiving file:', data.metadata.name);
            } else if (data.type === 'file-chunk') {
              setReceivedChunks((prevChunks) => [...prevChunks, data.chunk]); // Collect chunks
            } else if (data.type === 'file-transfer-complete') {
              console.log('File transfer complete');
              setIsDownloading(false);
            }
          });
        });

        conn.on('close', () => {
          console.log('Connection closed');
        });
      });

      receiverPeer.on('error', (err) => {
        console.error('Peer error:', err);
      });
    }
  }, [socket]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  //sender handler
  const handleShare = () => {
    //initiate sender peer connection
    const senderPeer = new Peer();
    senderPeer.on('open', (id) => {
      // Emit the peer ID to the server
      socket?.emit('peer-id', id);
      const link = `${window.location.origin}/?peerId=${id}`;
      setGeneratedLink(link); //generate a link for other peers to connect
    });

    //handling receiver connection
    senderPeer.on('connection', (conn) => {

      conn.on('open', () => {
        // Send file metadata
        const fileMetadata = {
          name: file?.name,
          size: file?.size,
          type: file?.type,
        };
        conn.send({ type: 'file-metadata', metadata: fileMetadata });

        // Read and send the file in chunks
        const reader = new FileReader();
        reader.onload = () => {
          const chunkSize = 64 * 1024; // 64 KB chunks
          const buffer = reader.result as ArrayBuffer;

          for (let i = 0; i < buffer.byteLength; i += chunkSize) {
            const chunk = buffer.slice(i, i + chunkSize);
            conn.send({ type: 'file-chunk', chunk });
          }

          // Notify the receiver that the file transfer is complete
          conn.send({ type: 'file-transfer-complete' });
        };

        reader.readAsArrayBuffer(file!);
      });

      conn.on('close', () => {
        console.log('Connection closed');
      });
    });

    senderPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });
  };

  const handleDownload = () => {
    if (receivedChunks.length > 0 && fileName) {
      // Combine all chunks into a single Blob
      const fileBlob = new Blob(receivedChunks);
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <div>BYTE-BRIDGE</div>
      <div>Peer-to-peer file transfer from your browser</div>

      {!isReceiver && (
        <>
          <input type="file" onChange={handleFileChange} />
          {file && <button onClick={handleShare}>Upload</button>}
        </>
      )}

      {generatedLink && (
        <div>
          <p>Share this link with the receiver:</p>
          <a href={generatedLink} target="_blank" rel="noopener noreferrer">
            {generatedLink}
          </a>
        </div>
      )}

      {isReceiver && (
        <div>
          {isDownloading ? (
            <p>Downloading file: {fileName}</p>
          ) : (
            receivedChunks.length > 0 && (
              <>
                <p>File ready to download: {fileName}</p>
                <button onClick={handleDownload}>Download</button>
              </>
            )
          )}
        </div>
      )}
    </>
  );
};

export default App;