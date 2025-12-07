import NavBar from "./NavBar";
import Footer from "./Footer";
import {Outlet} from "react-router-dom"

export default function Layout(){
    return (
    <>
    <Outlet/>
    <Footer/>
    </>
 )
}