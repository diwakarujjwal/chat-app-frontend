import { useEffect, useRef, useState } from "react";
import "./App.css";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { Slide, toast } from "react-toastify";
import { FaRegUserCircle, FaUserCircle } from "react-icons/fa";
import { IoMdSad } from "react-icons/io";

type ServerMessage = {
  type:
    | "createdRoom"
    | "joinedRoom"
    | "message"
    | "username_error"
    | "roomid_error"
    | "roomnoexist"
    | "userJoined"
    | "userLeft";
  payload: any;
};
function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [response, setResponse] = useState<ServerMessage[]>([]);
  const [roomId, setRoomId] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [inChat, setInChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const SendInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const wss = new WebSocket("ws://localhost:8080");

    wss.onopen = () => {
      console.log("Connected to server");
    };

    wss.onclose = () => {
      console.log("Disconnected from server");
    };

    wss.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wss.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data);

      if (data.type === "createdRoom") {
        setRoomId(data.payload.roomId);
      }

      if (data.type === "joinedRoom") {
        setRoomId(data.payload.roomId);
        toast.success(`Joined Room - ${data.payload.roomId}`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
        setLoading(false);
        setInChat(true);
      }
      if (data.type === "username_error") {
        toast.error("Missing Username Value!", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
      }
      if (data.type === "roomid_error") {
        toast.error("Missing Room ID Value", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
      }

      if (data.type === "roomnoexist") {
        toast.error("Invalid Room ID Entered", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
        setRoomId("");
        setInChat(false);
      }
      if (data.type === "userJoined") {
        toast.info(`User: ${data.payload.username} has joined the Room`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
      }
      if (data.type === "userLeft") {
        toast.info(`User: ${data.payload.username} has left the Room`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Slide,
        });
      }
      console.log("Received:", data);
      setResponse((prev) => [...prev, data]);
    };

    setWs(wss);

    return () => {
      wss.close();
    };
  }, []);

  function createRoom() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    } else if (!username?.trim()) {
      setLoading(true);
      ws.send(
        JSON.stringify({
          type: "NoUsernameError",
        })
      );
      return;
    }
    setLoading(true);
    ws.send(
      JSON.stringify({
        type: "create",
        payload: {
          username: username,
        },
      })
    );
    setResponse([]);
    setInChat(true);
  }

  function joinRoom() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (!username?.trim()) {
      ws.send(
        JSON.stringify({
          type: "NoUsernameError",
        })
      );
      return;
    }
    if (!roomId?.trim()) {
      ws.send(
        JSON.stringify({
          type: "NoRoomIDError",
        })
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "join",
        payload: {
          roomId: roomId,
          username: username,
        },
      })
    );
    setResponse([]);
  }

  function sendMessage() {
    if (
      !ws ||
      !SendInputRef.current ||
      ws.readyState !== WebSocket.OPEN ||
      SendInputRef.current.value.trim() === ""
    ) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "message",
        payload: {
          message: SendInputRef.current.value,
          roomId: roomId,
          username,
        },
      })
    );

    SendInputRef.current.value = "";
  }

  return loading ? (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <p>Loading...</p>
    </div>
  ) : inChat ? (
    <Chat
      SendInputRef={SendInputRef}
      sendMessage={sendMessage}
      response={response}
      username={username!}
      roomId={roomId!}
    />
  ) : (
    <Lobby
      setUsername={setUsername}
      createRoom={createRoom}
      setRoomId={setRoomId}
      joinRoom={joinRoom}
      username={username}
      roomId={roomId}
    />
  );
}

function Lobby({
  setUsername,
  createRoom,
  setRoomId,
  joinRoom,
  roomId,
  username,
}: {
  username: string | undefined;
  setUsername: (val: string) => void;
  roomId: string | undefined;
  setRoomId: (val: string) => void;
  createRoom: () => void;
  joinRoom: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "auto",
        height: "100vh",
      }}
    >
      <div
        style={{
          border: "1px solid #333",
          borderRadius: "10px",
          padding: "20px",
          width: "600px",
        }}
        className="main-box"
      >
        <div
          style={{
            fontSize: "1.5rem",
            lineHeight: "2rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <IoChatbubbleEllipsesOutline />
          <b> Real Time Chat</b>
        </div>
        <div
          style={{
            color: "hsl(0, 0%, 63.9%)",
            fontSize: ".875rem",
            lineHeight: "1.25rem",
          }}
        >
          temporary room that expires after all users exit
        </div>
        <div>
          <div
            onClick={createRoom}
            style={{
              marginTop: "30px",
              width: "auto",
              backgroundColor: "white",
              color: "black",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Create Room
          </div>
        </div>
        <input
          type="text"
          placeholder="Enter your Name"
          value={username ?? ""}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            marginTop: "15px",
            width: "580px",
            height: "40px",
            color: "#f7f5f5",
            backgroundColor: "black",
            paddingLeft: "15px",
            borderRadius: "10px",
            borderColor: "#333",
          }}
        />
        <div
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "15px",
            gap: "5px",
          }}
        >
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomId ?? ""}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              height: "40px",
              color: "#f7f5f5",
              backgroundColor: "black",
              paddingLeft: "15px",
              borderRadius: "10px",
              borderColor: "#333",
              width: "432px",
            }}
          />

          <button
            onClick={joinRoom}
            style={{
              width: "auto",
              backgroundColor: "white",
              color: "black",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "5px",
              paddingLeft: "15px",
              paddingRight: "15px",
            }}
          >
            Join the Room
          </button>
        </div>
      </div>
    </div>
  );
}

function Chat({
  SendInputRef,
  sendMessage,
  response,
  username,
  roomId,
}: {
  sendMessage: () => void;
  response: ServerMessage[];
  SendInputRef: React.RefObject<HTMLInputElement | null>;
  username: string;
  roomId: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1>Chat Room:</h1>
        <h4
          style={{
            color: "hsl(0, 0%, 63.9%)",
            fontSize: ".875rem",
          }}
        >
          Room ID: {roomId}
        </h4>
      </div>
      <div
        style={{
          backgroundColor: "black",
          height: "625px",
          overflowY: "scroll",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          border: "2px solid #333",
        }}
      >
        {response.filter((r) => r.type === "message").length === 0 ? (
          <div
            style={{
              color: "white",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <IoMdSad /> No messages yet.
          </div>
        ) : (
          response
            .filter((r) => r.type === "message")
            .map((r, idx) => {
              const isOwnMessage = r.payload.username === username;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: isOwnMessage
                      ? "hsl(195, 100%, 50%)"
                      : "hsl(120, 60%, 50%)",
                    color: "black",
                    display: "inline-block",
                    alignSelf: isOwnMessage ? "flex-start" : "flex-end",
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {
                      <span
                        style={{
                          fontSize: "10px",
                          color: isOwnMessage ? "#DC143C" : "#6A0DAD",
                          alignSelf: isOwnMessage ? "flex-start" : "flex-end",
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        {isOwnMessage ? (
                          <>
                            <FaRegUserCircle /> {r.payload.username}
                          </>
                        ) : (
                          <>
                            {r.payload.username} <FaUserCircle />
                          </>
                        )}
                      </span>
                    }
                    {r.payload.message}
                  </div>
                </div>
              );
            })
        )}
      </div>
      <div
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "15px",
          gap: "5px",
        }}
      >
        <input
          type="text"
          placeholder="Write a message to send."
          ref={SendInputRef}
          onKeyDown={handleKeyDown}
          style={{
            height: "40px",
            color: "#f7f5f5",
            backgroundColor: "black",
            paddingLeft: "15px",
            borderRadius: "10px",
            borderColor: "#333",
            width: "1205px",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            width: "auto",
            backgroundColor: "white",
            color: "black",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: "5px",
            paddingLeft: "15px",
            paddingRight: "15px",
          }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}

export default App;
