import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer, { DataConnection } from 'peerjs';

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
    // Initiate sender peer connection
    const senderPeer = new Peer();
    senderPeer.on('open', (id) => {
      // Emit the peer ID to the server
      socket?.emit('peer-id', id);
      const link = `${window.location.origin}/?peerId=${id}`;
      setGeneratedLink(link); // Generate a link for other peers to connect
    });
  
    // Handling receiver connection
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
        const sendFile = (file: File, conn: DataConnection) => {
          const chunkSize = 64 * 1024; // 64 KB chunks
          let offset = 0;
  
          const streamFile = () => {
            if (offset < file.size) {
              // Slice the file into a chunk
              const chunk = file.slice(offset, offset + chunkSize);
  
              const reader = new FileReader();
              reader.onload = (e) => {
                // Send the chunk to the receiver
                conn.send({
                  type: 'file-chunk',
                  chunk: e.target?.result, // The chunk data
                  offset, // Current offset
                });
  
                // Move to the next chunk
                offset += chunkSize;
                streamFile(); // Recursive call to send the next chunk
              };
  
              // Handle errors during file reading
              reader.onerror = () => {
                console.error('Error reading file chunk');
              };
  
              // Read the chunk as an ArrayBuffer
              reader.readAsArrayBuffer(chunk);
            } else {
              // Notify the receiver that the transfer is complete
              conn.send({ type: 'file-transfer-complete' });
              console.log('File transfer complete');
            }
          };
  
          // Start the streaming process
          streamFile();
        };
  
        // Call the sendFile function
        if (file) sendFile(file, conn);
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
      a.download = `bytebridge.${fileName}`; // Prepend 'bytebridge.' to the original file name
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