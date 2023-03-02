import { useEffect, useRef } from "react";
import PSPDFKit from 'pspdfkit';
import axios from "axios";
import { saveAs } from "file-saver";
import { useState } from "react";
import Modal from 'react-bootstrap/Modal';
import { Button, Spinner } from "react-bootstrap";


export default function PdfViewerComponent(props) {
    const containerRef = useRef(null); // for PdfKit container
    // const [instance, setInstance] = useState(null);
    let globalInstance = null;
    const [instance, setInstance] = useState(null);
	const [show, setShow] = useState(false);
    const [updatedBuffer, setUpdatedBuffer] = useState(null);
    const [loader, setLoader] = useState(false);
    const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);


     // Load pdf kit SDK
     useEffect(() => {
        const container = containerRef.current;
        const baseUrl = `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`;
        const items = PSPDFKit.defaultToolbarItems; // Default toolbar items
        items.push(downloadButton);

        (async function() {
            let instance = null;
            PSPDFKit.unload(container)
            instance = await PSPDFKit.load({
            container,
            document: props.document,
            baseUrl: baseUrl,
            // toolbarPlacement: PSPDFKit.ToolbarPlacement.BOTTOM, // Can change placement
            toolbarItems: [
                ...items,
                {
                    type: "form-creator",   // Enable designer mode
                }
            ]
            }).then((response) => {
                setInstance(response);
                globalInstance = response;
                console.log("Loaded SDK!", response)
            });
        })();
        

        return () => {
            if (PSPDFKit) {
            PSPDFKit.unload(container);
            globalInstance = null;
            setInstance(null);
            }
        };}, []);

    // Custom download button in the toolbar
    const downloadButton = {
        type: "custom",
        id: "save-pdf",
        icon: "/download.svg",
        title: "Download",
        onPress: () => {
            globalInstance?.exportPDF().then((buffer) => { 
                console.log("Updated buffer", buffer)
                setUpdatedBuffer(buffer);
                setShow(true);
            });
        }
    };

    // Save updated version of the PDF
    const savePdfOnServer = async () => {
        if (updatedBuffer) {
            setLoader(true);
            const blob = new Blob([updatedBuffer], { type: "application/pdf" });
            const formData = new FormData();
            formData.append("file", blob, props.currentOpenDocument);
            await axios.post('http://localhost:3000/savePdf', formData, { headers: { 'Content-Type': 'multipart/form-data' }})
            .then((response) => {
                console.log(response);
                setTimeout(() => {setLoader(false); setShow(false)}, 1000); // 2-second delay
            })
            .catch((error) => {
                console.log(error);
                setTimeout(() => setLoader(false), 1000); // 2-second delay
                setShow(false);
            })
        } else {
            console.log("Update the document first")
        }
    }

    return (
        <>
        <div>

            <div ref={containerRef} style={{ width: "100%", height: "100vh"}}/>
            {show && 
             <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to update the PDF?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={savePdfOnServer}>
                        {loader ? <>Loading <Spinner size="sm" animation="border"/></> : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
         }
        </div>
        </>
        
    );
}
const SavePdfModal = ({show, handleClose}) =>{
	return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to update the PDF?
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={handleClose}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>
	)
}