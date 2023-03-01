import PdfViewerComponent from './PdfViewerComponent';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import { Buffer } from 'buffer';

function App() {
    const [formData, setFormData] = useState({});
	const [show, setShow] = useState(false);
	const [currentDocument, setCurrentDocument] = useState();
	const [openedFile, setOpenedFile] = useState('');
	const [documentList, setDocumentList] = useState();
	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);
	const [file, setFile] = useState(null);
	const [loader, setLoader] = useState(false);
	const [refetch, setRefetch] = useState(false);

	const savePdfOnServer = async (e) => {
		e.preventDefault();
        if (file) {
            setLoader(true);
            // const blob = new Blob([file], { type: "application/pdf" });
            const formData = new FormData();
            formData.append("file", file);
            await axios.post('http://localhost:3000/savePdf', formData, { headers: { 'Content-Type': 'multipart/form-data' }})
            .then((response) => {
				console.log(response)
                setTimeout(() => {setLoader(false); setShow(false)}, 1000); // 2-second delay
				setRefetch(!refetch)
            })
            .catch((error) => {
                console.log(error);
                setTimeout(() => setLoader(false), 1000); // 2-second delay
            })
        }
    }


	const handleFileChange = (event) => {
		setFile(event.target.files[0]);
	};

	const handleButtonClick = () => {
		document.getElementById("file-input").click();
	};
	
	
    const onInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prevState => ({ ...prevState, [name]: value }));
	}

	useEffect(() => {
		const getTemplateList = async () => {
			await axios.get('http://localhost:3000/pdfList')
			.then((response) => setDocumentList(response.data))
			.catch((error )=> {console.log(error)})
		}
		getTemplateList();
	}, [refetch])

	const getPdf = async (fileName) => {
		setOpenedFile(fileName);
		setCurrentDocument(null);
		await axios.get(`http://localhost:3000/pdf/${fileName}`, {
			headers: {
				Accept: 'application/pdf',
			  },
		})
		.then(async (response) => {
			const base64Str = response.data;
			const buffer = Buffer.from(base64Str, 'base64');
			const blob = new Blob([buffer], { type: 'application/pdf' });
			const documentBlobObjectUrl = URL.createObjectURL(blob);
			setCurrentDocument(documentBlobObjectUrl);
			handleClose();
		})
		.catch((error) => {console.log(error)})
	}

	// Generate PDF File
	const generatePdfFile = async () => {
		await axios.get(`http://localhost:3000/generatePdf/${openedFile}`, {
			headers: {
				Accept: 'application/pdf',
			  },
		})
		.then(async (response) => {
			const base64Str = response.data;
			const buffer = Buffer.from(base64Str, 'base64');
			const blob = new Blob([buffer], { type: 'application/pdf' });
			const documentBlobObjectUrl = URL.createObjectURL(blob);

			// Download the pdf
			const link = document.createElement('a');
			link.href = documentBlobObjectUrl;
			link.download = 'document.pdf';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		})
		.catch((error) => {console.log(error)})
	}

	return (
		<div className="App">
			{show &&
				<Modal show={show} onHide={handleClose}>
				<Modal.Header closeButton>
				<Modal.Title>Modal heading</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<input
						  accept="application/pdf"
						id="file-input"
						type="file"
						style={{ display: "none" }}
						onChange={handleFileChange}
					/>
					<ul style={{'listStyle': 'none'}}>
					{documentList.map((document, index) => {return (
						<li className='list-style-none'>
							<Button key={index} className='mt-1 me-2' variant='primary' onClick={() => getPdf(document)}>{document}</Button>
						</li>
					)})}
					</ul>
					<div className='row'>
						<div className='col-8'>
							<a href='#' onClick={handleButtonClick}>Add another document</a>
							{file && <p>Selected file: {file.name}</p>}
						</div>
						<div className='col-4'>
							{file && 
								<Button 
									className='float-end' 
									size='sm' 
									onClick={(e) => savePdfOnServer(e)}
								>
									{loader? <><Spinner size='sm' animation='border'/> Loading</> : 'Upload'}
								</Button>}
						</div>
					</div>
				
					
	
				</Modal.Body>
				<Modal.Footer>
					<Button variant="danger" onClick={handleClose}>
						Close
					</Button>
					{/* <Button variant="primary" onClick={handleClose}>
						Save Changes
					</Button> */}
				</Modal.Footer>
			  </Modal>
			}

			<div className='mt-5 text-center'>
				<Button onClick={handleShow} variant="primary">Open a template for editing</Button>{' '}
				{currentDocument ? <p style={{'fontSize' : '9px'}}>Selected Document: {openedFile}</p> : null}
				{currentDocument ? <p>Generate PDF For:  <a onClick={() => generatePdfFile()} href="#">{openedFile}</a></p> : null}
			</div>

			<div>
				{currentDocument && 
				<PdfViewerComponent
					document = {currentDocument}
					currentOpenDocument = {openedFile}
				/> 
				}
			</div>

		</div>
	);
}

// const OpenTemplateModal = ({show, handleClose, documentList, getPdf, handleFileChange, handleButtonClick, file, savePdfOnServer, loader}) =>{
// 	return (
		
// 	)
// }
export default App;