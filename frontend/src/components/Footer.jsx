import whiteLogo from "../assets/whiteLogo.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import "../styles/Footer.css"
export default function Footer(){
    return(
        <footer>
        <section>
            <div className="media-info">
                <img src ={whiteLogo}/>
                <p>future of Digital pathology</p>
                <ul className="social-links">
                <li><a><FontAwesomeIcon icon={faFacebook} className="social-icon" /></a></li>
                <li><a><FontAwesomeIcon icon={faInstagram} className="social-icon" /></a></li>
                <li><a><FontAwesomeIcon icon={faLinkedin} className="social-icon" /></a></li>
                <li><a><FontAwesomeIcon icon={faXTwitter} className="social-icon" /></a></li>
                </ul>
            </div>
            <div className="why">
                <h3>Why Pathoscope</h3>
                <p>Patient portal</p>
                <p>Staff adimnistiration</p>
                <p>digital pathology</p>
            </div>
             <div className="contact" id="contact">
                <h3>Contact US</h3>
                <p>address : Cairo , Egypt</p>
                <p>Phone : +201018618097</p>
                <p>email : pathoscope@gmail.com</p>
            </div>
        </section>
        <p>© 2025 PathoScope – Advanced Laboratory Information System with Digital Pathology</p>
        </footer>
    )
}