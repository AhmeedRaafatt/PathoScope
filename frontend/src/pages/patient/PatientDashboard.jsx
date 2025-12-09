import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import DashBoardCard from '../../components/patient/DashBoardCard';
import { faCalendarCheck, faFileAlt, faDollarSign, faVial, faChevronRight, faDownload, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/patient/Dashboard.css';

export default function PatientDashboard() {
    const context = useOutletContext();
    
    // Safely destructure with defaults
    const appointments = Array.isArray(context?.appointments) ? context.appointments : [];
    const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
    const invoices = Array.isArray(context?.invoices) ? context.invoices : [];

    const [displayedText, setDisplayedText] = useState('');
    const [displayedSubtext, setDisplayedSubtext] = useState('');
    const fullText = `Welcome back ${localStorage.getItem('username') || 'Guest'} ! 👋`;
    const fullSubtext = "here is your health overview";

    // Typewriter effect for main text
    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(timer);
            }
        }, 60);
        return () => clearInterval(timer);
    }, [fullText]);

    // Typewriter effect for subtext
    useEffect(() => {
        const delay = fullText.length * 60 + 300;
        const timeoutId = setTimeout(() => {
            let index = 0;
            const timer = setInterval(() => {
                if (index <= fullSubtext.length) {
                    setDisplayedSubtext(fullSubtext.slice(0, index));
                    index++;
                } else {
                    clearInterval(timer);
                }
            }, 50);
            return () => clearInterval(timer);
        }, delay);
        return () => clearTimeout(timeoutId);
    }, [fullText, fullSubtext]);

    // Calculate stats from context data
    const upcomingAppointments = appointments
        .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
        .slice(0, 2);

    const recentResults = testOrders
        .filter(order => order.status === 'Report Ready' || order.status === 'Complete')
        .slice(0, 3);

    const unpaidInvoices = invoices
        .filter(invoice => invoice.payment_status === 'unpaid')
        .slice(0, 2);

    const totalUnpaid = invoices
        .filter(invoice => invoice.payment_status === 'unpaid')
        .reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0);

    const newResultsCount = testOrders.filter(order => 
        order.status === 'Report Ready' || order.status === 'Complete'
    ).length;

    // Payment handler with data refresh
    const handlePayment = async (invoiceId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:8000/api/patient-portal/invoices/${invoiceId}/pay/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                alert('Payment successful!');
                // Refresh data from parent context
                if (context?.refreshData) {
                    await context.refreshData();
                } else {
                    window.location.reload();
                }
            } else {
                alert('Payment failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment error. Please try again.');
        }
    };

    return (
        <main className='dashboard'>
            {/* Header with Typewriter */}
            <header className="dashboard-header">
                <h1>{displayedText}</h1>
                <p>{displayedSubtext}</p>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <DashBoardCard
                    type="appointments"
                    icon={faCalendarCheck}
                    status={upcomingAppointments.length ? "Active" : null}
                    number={upcomingAppointments.length}
                    text="Upcoming Appointments"
                />
                <DashBoardCard
                    type="results"
                    icon={faFileAlt}
                    status={newResultsCount ? "New" : null}
                    number={newResultsCount}
                    text="New Results Available"
                />
                <DashBoardCard
                    type="billing"
                    icon={faDollarSign}
                    status={unpaidInvoices.length ? "Due" : null}
                    number={`$${totalUnpaid.toFixed(0)}`}
                    text="Outstanding Balance"
                />
                <DashBoardCard
                    type="tests"
                    icon={faVial}
                    number={testOrders.length}
                    text="Total Test Orders"
                />
            </div>

            {/* Upcoming Appointments Section */}
            {upcomingAppointments.length > 0 && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FontAwesomeIcon icon={faCalendarCheck} className="section-icon" />
                            Upcoming Appointments
                        </h2>
                        <Link to="/patient/appointments" className="view-all-link">
                            View All
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Link>
                    </div>

                    <div className="items-list">
                        {upcomingAppointments.map(appointment => (
                            <div key={appointment.id} className="list-item appointment-item">
                                <div className="item-icon-wrapper appointments">
                                    <FontAwesomeIcon icon={faCalendarCheck} />
                                </div>
                                <div className="item-content">
                                    <h3 className="item-title">{appointment.test_type ? appointment.test_type.replace('_', ' ') : (appointment.reason || 'Appointment')}</h3>
                                    <p className="item-subtitle">
                                        <FontAwesomeIcon icon={faClock} className="small-icon" />
                                        {appointment.date} at {appointment.time}
                                    </p>
                                </div>
                                <span className={`status-badge ${appointment.status?.toLowerCase() || 'pending'}`}>
                                    {appointment.status || 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Test Results Section */}
            {recentResults.length > 0 && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FontAwesomeIcon icon={faFileAlt} className="section-icon" />
                            Recent Test Results
                        </h2>
                        <Link to="/patient/results" className="view-all-link">
                            View All
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Link>
                    </div>

                    <div className="items-list">
                        {recentResults.map(result => (
                            <div key={result.id} className="list-item result-item">
                                <div className="item-icon-wrapper results">
                                    <FontAwesomeIcon icon={faFileAlt} />
                                </div>
                                <div className="item-content">
                                    <h3 className="item-title">{result.test_name || 'Test Result'}</h3>
                                    <p className="item-subtitle">
                                        <span className="test-type-badge">{result.test_type || 'General'}</span>
                                        {result.order_date ? new Date(result.order_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) : 'Date N/A'}
                                    </p>
                                </div>
                                {result.report_url && (
                                    <a 
                                        href={result.report_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="action-btn primary"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                        View Report
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Unpaid Invoices Section */}
            {unpaidInvoices.length > 0 && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FontAwesomeIcon icon={faDollarSign} className="section-icon" />
                            Unpaid Invoices
                        </h2>
                        <Link to="/patient/billings" className="view-all-link">
                            View All
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Link>
                    </div>

                    <div className="items-list">
                        {unpaidInvoices.map(invoice => (
                            <div key={invoice.id} className="list-item invoice-item">
                                <div className="item-icon-wrapper billing">
                                    <FontAwesomeIcon icon={faDollarSign} />
                                </div>
                                <div className="item-content">
                                    <h3 className="item-title">
                                        {invoice.test_name || 'Invoice'}
                                        <span className="invoice-number">#{invoice.id}</span>
                                    </h3>
                                    <p className="item-subtitle">
                                        Due: {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                                <div className="invoice-actions">
                                    <span className="amount">${parseFloat(invoice.amount || 0).toFixed(2)}</span>
                                    <Link 
                                        className="action-btn primary"
                                        to="/patient/billings"
                                    >
                                        Pay Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State Messages */}
            {upcomingAppointments.length === 0 && recentResults.length === 0 && unpaidInvoices.length === 0 && (
                <section className="dashboard-section empty-state">
                    <p className="empty-message">
                        You don't have any recent activity. Book an appointment to get started!
                    </p>
                    <Link to="/patient/appointments/book" className="btn-primary">
                        Book Appointment
                    </Link>
                </section>
            )}
        </main>
    );
}