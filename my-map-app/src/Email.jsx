import React, { useState, useRef, useEffect } from "react";
import "./Email.css";
import axios from "axios";

// Dynamically import emailjs to avoid Vite optimization issues
const importEmailJs = () => import("@emailjs/browser").then(module => module.default);

const EmergencyCorner = ({ currentPosition, autoExpand = false, onClose = () => {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [emails, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [receiverList, setReceiverList] = useState([
    { name: "Emergency Contact 1", email: "ramanrandive2004@gmail.com" },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [emailJsLoaded, setEmailJsLoaded] = useState(false);
  const formRef = useRef();
  const autoSendTimeoutRef = useRef(null);
  const [lastAutoExpandTime, setLastAutoExpandTime] = useState(null);
  
  // Handle auto-expansion from parent component
  useEffect(() => {
    if (autoExpand) {
      // Prevent multiple auto-expansions within 15 minutes
      const currentTime = Date.now();
      if (!lastAutoExpandTime || (currentTime - lastAutoExpandTime > 15 * 60 * 1000)) {
        setLastAutoExpandTime(currentTime);
        setExpanded(true);
        
        // Auto-send if auto-expanded (with a short delay)
        if (currentPosition && receiverList.length > 0) {
          // Clear any existing timeout
          if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
          }
          
          // Set timeout to auto-send after 2 seconds
          autoSendTimeoutRef.current = setTimeout(() => {
            // Create a synthetic event object for the sendEmail function
            const syntheticEvent = { preventDefault: () => {} };
            sendEmail(syntheticEvent, true); // Pass true for autoSend parameter
          }, 2000);
        }
      }
    }
    
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [autoExpand, currentPosition]);
  
  // Lazy load EmailJS
  useEffect(() => {
    let mounted = true;
    
    const loadEmailJs = async () => {
      try {
        await importEmailJs();
        if (mounted) {
          setEmailJsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load EmailJS:", error);
      }
    };
    
    loadEmailJs();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Update default message when position changes
  useEffect(() => {
    if (currentPosition) {
      const locationLink = `https://maps.google.com/?q=${currentPosition[1]},${currentPosition[0]}`;
      setMessage(
        `EMERGENCY ALERT: I need help at my current location. You can find me here: ${locationLink}`
      );
    } else {
      setMessage("EMERGENCY ALERT: I need help at my current location.");
    }
  }, [currentPosition]);
  
  const sendEmail = async (e, isAutoSend = false) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus(null);
    
    try {
      // Import emailjs dynamically
      const emailjs = await importEmailJs();
      
      // Get current coordinates as a string
      const locationString = currentPosition 
        ? `Latitude: ${currentPosition[1]}, Longitude: ${currentPosition[0]}` 
        : "Location unavailable";
      
      const locationLink = currentPosition
        ? `https://maps.google.com/?q=${currentPosition[1]},${currentPosition[0]}`
        : "Location unavailable";
      
      // Create promises array for all email sends
      const emailPromises = receiverList.map(contact => {
        // Adapt to match the EmailJS template structure shown in your UI
        console.log(`${contact.email} and ${contact.name}`);
        const templateParams = {
          to_email: contact.email,
          subject: isAutoSend ? "AUTOMATIC DANGER ZONE ALERT" : "EMERGENCY ALERT",
          from_name: "Emergency Alert System",
          message: isAutoSend 
            ? `AUTOMATIC DANGER ALERT: System detected I'm in a dangerous area or haven't moved for an extended period. My current location: ${locationLink}`
            : message,
          title: isAutoSend ? "⚠️ AUTO-TRIGGERED DANGER ALERT ⚠️" : "Emergency SOS",
          name: contact.name || "Emergency Contact",
          email: contact.email,
          time: new Date().toLocaleString(),
          location_info: locationString,
          location_link: locationLink
        };
        
        // Use environment variables (replace with your actual env var names)
        return emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_iu62ljt', 
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_xxbfkz8', 
          templateParams, 
          { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'hnmtT2SXFGDX3_MkZ' }
        );
      });
      
      // Wait for all emails to be sent
      await Promise.all(emailPromises);
      console.log("All emergency emails sent successfully");
      setSendStatus("success");
      
      // Auto-collapse after successful send
      setTimeout(() => {
        setExpanded(false);
        setSendStatus(null);
        
        // Call the onClose callback to reset the autoExpand state in parent
        if (isAutoSend) {
          onClose();
        }
      }, 3000);
    } catch (error) {
      console.error("Error sending emergency emails:", error);
      setSendStatus("error");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  
  const addEmail = async (e) => {
    e.preventDefault();
    if (!emails || !emails.includes('@')) return;
    // const reponse = JSON.parse(localStorage.getItem("userData"));
    console.log(`email value ${emails}`)
    const newContact = {
      name: "Emergency Contact",
      email: emails,
    };
    // const response = await axios.post("http://localhost:3001/saveContact", { email: reponse.email, EmMail: emails.trim() });
    // console.log("Data sent successfully:", response.data);
    console.log("emergency data saved succesfully");
    setReceiverList([...receiverList, newContact]);

    console.log(`${receiverList}`)
    setEmail("");
  };
  
  const removeContact = (index) => {
    const updatedList = [...receiverList];
    updatedList.splice(index, 1);
    setReceiverList(updatedList);
  };
  
  const handleClose = () => {
    setExpanded(false);
    onClose(); // Notify parent component
  };
  
  return (
    <div className={`emergency-corner ${expanded ? 'expanded' : 'collapsed'}`}>
      {!expanded ? (
        <button 
          className="emergency-corner-button"
          onClick={() => setExpanded(true)}
          aria-label="Open emergency SOS panel"
        >
          🚨 SOS
        </button>
      ) : (
        <div className="emergency-form-container">
          <div className="emergency-header">
            {autoExpand ? (
              <h3 className="auto-triggered">⚠️ AUTOMATIC DANGER ALERT ⚠️</h3>
            ) : (
              <h3>Emergency Alert</h3>
            )}
            <button 
              className="close-button"
              onClick={handleClose}
              aria-label="Close emergency panel"
            >
              ✕
            </button>
          </div>
          
          {autoExpand && (
            <div className="auto-alert-message">
              You are in a marked danger zone or haven't moved for an extended period! 
              Automatically alerting your emergency contacts.
            </div>
          )}
          
          <p className="current-location">
            {currentPosition 
              ? `Location: ${currentPosition[1].toFixed(5)}, ${currentPosition[0].toFixed(5)}` 
              : "Location: Waiting for GPS..."}
          </p>
          
          <form ref={formRef} onSubmit={sendEmail} className="emergency-form">
            <div className="message-container">
              <label htmlFor="message">Message:</label>
              <textarea 
                id="message" 
                name="message" 
                value={message} 
                onChange={handleMessageChange}
                rows="2"
              />
            </div>
            
            <div className="contacts-container">
              {receiverList.length > 0 && (
                <div className="contacts-list">
                  {receiverList.map((contact, index) => (
                    <div key={index} className="contact-item">
                      <span className="contact-email">{contact.email}</span>
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeContact(index)}
                        aria-label={`Remove ${contact.email}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="add-contact">
                <input 
                  id="toSend" 
                  name="toSend" 
                  value={emails} 
                  type="email" 
                  onChange={handleEmailChange}
                  placeholder="Add email address"
                />
                <button 
                  type="button" 
                  onClick={addEmail} 
                  className="add-btn"
                  disabled={!emails || !emails.includes('@')}
                  aria-label="Add email contact"
                >
                  +
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={`send-emergency-btn ${isSending ? 'sending' : ''} ${autoExpand ? 'auto-triggered' : ''}`}
              disabled={isSending || receiverList.length === 0 || !emailJsLoaded}
            >
              {isSending ? "Sending..." : autoExpand ? "SEND AUTOMATIC DANGER ALERT" : "SEND EMERGENCY ALERT"}
            </button>
            
            {sendStatus === 'success' && (
              <div className="status-message success">
                Alert sent successfully!
              </div>
            )}
            
            {sendStatus === 'error' && (
              <div className="status-message error">
                Error sending alert. Try again.
              </div>
            )}
            
            {!emailJsLoaded && (
              <div className="status-message warning">
                Loading email service...
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default EmergencyCorner;