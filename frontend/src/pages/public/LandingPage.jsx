import NavBar from "../../components/NavBar";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';
import { faFileMedical } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import aboutHeroImage from "../../assets/aboutHeroImage.png";
import { NavLink } from "react-router-dom";
import "../../styles/LandingPage.css"

const LandingAnimation = () => {
    return (
      <DotLottieReact
        src="https://lottie.host/71d3c67c-533e-4d76-a80a-7f1a7e178e7c/kCG4AdwZjd.lottie"
        loop
        autoplay
      />
    );
  };
  

export default function LandingPage(){
    

    return(
        <>
        <NavBar/>
        <section className="hero-landing">
            <div className="text">
                <h1>Your lab results, <span>instantly</span> and <span>securely</span> at hand</h1>
                <p>Book your sample collection appointment, view your blood tests and digital biopsy slides, download final reports as PDF, and pay your bills all in one secure patient portal. Anytime, anywhere.</p>
                <NavLink to="./login" className={()=>{return "login-hero-btn"}}>Login to pathoScope</NavLink>
            </div>

            <LandingAnimation/>

        </section>
        <section id="about">
            <img src={aboutHeroImage}/>
            <div>
                <h2>WHO we are </h2>
                <p>Future of digital pathology</p>
                <p>PathoScope is a next-generation Laboratory Information System that seamlessly combines routine blood tests with AI-powered digital pathology — delivering fast, secure, and complete lab results directly to patients and healthcare providers.</p>

            </div>
        </section>
        <section id="service">
            <h1>our services</h1>
            <section className="services">
                <div className="service">
                    <FontAwesomeIcon icon={faCalendarCheck} className="service-icon" />
                    <h2 className="service-name">Appoinments</h2>
                    <p>Book a convenient time slot for your sample collection (blood draw, biopsy, etc.) at the lab. You will receive a confirmation with all details and can view your upcoming appointments at any time.</p>
                </div>
                <div className="service">
                    <FontAwesomeIcon icon={faFileInvoiceDollar } className="service-icon" />
                    <h2 className="service-name">Invoices</h2>
                    <p>View and pay your lab invoices instantly. See itemized bills — for example “1x CBC – Complete Blood Count” and “1x Histopathology – Tissue Biopsy” — and complete payment securely in just a few clicks.</p>
                </div>
                <div className="service">
                    <FontAwesomeIcon icon={faSquarePollHorizontal }className="service-icon" />
                    <h2 className="service-name">Results</h2>
                    <p>All your finalized lab reports appear in one place, with hematology shown as simple tables and pathology provided as PDFs with optional slide viewing, available only after lab validation.</p>
                </div>
                <div className="service">
                    <FontAwesomeIcon icon={ faFileMedical } className="service-icon" />
                    <h2 className="service-name">Digital Pathology Slides</h2>
                    <p>For tissue biopsies and histopathology examinations, explore your digital slides in our advanced viewer. Zoom, pan, adjust contrast, and see AI-highlighted areas of interest — just like the pathologist.</p>
                </div>
                <div className="service">
                    <FontAwesomeIcon icon={ faFolderOpen }className="service-icon" />
                    <h2 className="service-name">Reports and Documents</h2>
                    <p>Download all official signed reports as PDF. Additional attachments (photos, measurement charts, etc.) are available here whenever applicable.</p>
                </div>
                <div className="service">
                    <FontAwesomeIcon icon={ faCircleUser } className="service-icon" />
                    <h2 className="service-name">Profile and Notifications</h2>
                    <p>Update your personal information, phone number, and insurance details. Choose whether you want to receive email or SMS reminders for upcoming appointments and new results.</p>
                </div>
            </section>
            
            
        </section>
        </>
    )
}