import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, CreditCard, X, CheckCircle, Clock, DollarSign } from 'lucide-react';
import '../../styles/patient/Billings.css';
import { getToken } from '../../utls';

const ViewInvoices = () => {
  const context = useOutletContext();
  const invoices = Array.isArray(context?.invoices) ? context.invoices : [];
  const [loadingInvoice, setLoadingInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    paymentMethod: 'credit_card'
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setErrorMessage(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentForm({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      paymentMethod: 'credit_card'
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoadingInvoice(selectedInvoice.id);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const token = getToken();
      const res = await fetch(`http://127.0.0.1:8000/api/patient-portal/invoices/${selectedInvoice.id}/pay/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        let err = await res.json().catch(() => null);
        const message = err?.detail || err?.message || 'Payment failed. Please try again.';
        setErrorMessage(message);
      } else {
        setPaymentSuccess(true);
        setTimeout(() => {
          if (context?.refreshData) context.refreshData();
          closePaymentModal();
        }, 2000);
      }
    } catch (e) {
      console.error('Payment error', e);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoadingInvoice(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number (spaces every 4 digits)
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentForm(prev => ({ ...prev, [name]: formatted }));
    } 
    // Format expiry date (MM/YY)
    else if (name === 'expiryDate') {
      let formatted = value.replace(/\D/g, '');
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
      }
      setPaymentForm(prev => ({ ...prev, [name]: formatted }));
    } 
    // CVV (max 3 digits)
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 3);
      setPaymentForm(prev => ({ ...prev, [name]: formatted }));
    } 
    else {
      setPaymentForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Separate invoices by status
  const unpaidInvoices = invoices.filter(inv => inv.payment_status === 'unpaid');
  const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid');

  return (
    <div className="billing-container">
      {/* Summary Cards */}
      <div className="billing-summary">
        <div className="summary-card unpaid">
          <div className="summary-icon">
            <Clock size={24} />
          </div>
          <div className="summary-details">
            <p className="summary-label">Outstanding Balance</p>
            <h2 className="summary-amount">
              {formatCurrency(unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}
            </h2>
            <p className="summary-count">{unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="summary-card paid">
          <div className="summary-icon">
            <CheckCircle size={24} />
          </div>
          <div className="summary-details">
            <p className="summary-label">Total Paid</p>
            <h2 className="summary-amount">
              {formatCurrency(paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}
            </h2>
            <p className="summary-count">{paidInvoices.length} paid invoice{paidInvoices.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="summary-card total">
          <div className="summary-icon">
            <DollarSign size={24} />
          </div>
          <div className="summary-details">
            <p className="summary-label">Total Invoices</p>
            <h2 className="summary-amount">
              {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}
            </h2>
            <p className="summary-count">{invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <section className="billing-section">
          <h2 className="section-title">Unpaid Invoices</h2>
          <div className="invoice-list">
            {unpaidInvoices.map(invoice => (
              <div key={invoice.id} className="invoice-card unpaid">
                <div className="invoice-header">
                  <div className="invoice-info">
                    <div className="invoice-icon-wrapper unpaid">
                      <FileText size={20} />
                    </div>
                    <div className="invoice-details">
                      <h3 className="invoice-title">{invoice.test_name}</h3>
                      <p className="invoice-date">Invoice #{invoice.id} • {formatDate(invoice.created_date)}</p>
                    </div>
                  </div>
                  <div className="invoice-amount-section">
                    <span className="invoice-amount">{formatCurrency(invoice.amount)}</span>
                    <button 
                      className="btn-pay"
                      onClick={() => openPaymentModal(invoice)}
                    >
                      <CreditCard size={16} />
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paid Invoices */}
      {paidInvoices.length > 0 && (
        <section className="billing-section">
          <h2 className="section-title">Payment History</h2>
          <div className="invoice-list">
            {paidInvoices.map(invoice => (
              <div key={invoice.id} className="invoice-card paid">
                <div className="invoice-header">
                  <div className="invoice-info">
                    <div className="invoice-icon-wrapper paid">
                      <CheckCircle size={20} />
                    </div>
                    <div className="invoice-details">
                      <h3 className="invoice-title">{invoice.test_name}</h3>
                      <p className="invoice-date">
                        Invoice #{invoice.id} • Paid on {formatDate(invoice.paid_date)}
                      </p>
                    </div>
                  </div>
                  <div className="invoice-amount-section">
                    <span className="invoice-amount">{formatCurrency(invoice.amount)}</span>
                    <span className="status-badge paid">Paid</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h3>No invoices</h3>
          <p>You don't have any invoices at this time.</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!paymentSuccess ? (
              <>
                <div className="modal-header">
                  <h2>Payment Details</h2>
                  <button className="modal-close" onClick={closePaymentModal}>
                    <X size={24} />
                  </button>
                </div>

                <div className="payment-summary">
                  <div className="payment-summary-row">
                    <span>Invoice #{selectedInvoice.id}</span>
                    <span className="payment-test-name">{selectedInvoice.test_name}</span>
                  </div>
                  <div className="payment-summary-row total">
                    <span>Total Amount</span>
                    <span className="payment-total">{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="payment-form">
                  <div className="form-group">
                    <label>Payment Method</label>
                    <div className="payment-methods">
                      <label className="payment-method-option">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="credit_card"
                          checked={paymentForm.paymentMethod === 'credit_card'}
                          onChange={handleInputChange}
                        />
                        <CreditCard size={20} />
                        Credit Card
                      </label>
                      <label className="payment-method-option">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="debit_card"
                          checked={paymentForm.paymentMethod === 'debit_card'}
                          onChange={handleInputChange}
                        />
                        <CreditCard size={20} />
                        Debit Card
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input 
                      type="text"
                      name="cardName"
                      value={paymentForm.cardName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Number</label>
                    <input 
                      type="text"
                      name="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input 
                        type="text"
                        name="expiryDate"
                        value={paymentForm.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input 
                        type="text"
                        name="cvv"
                        value={paymentForm.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="error-message">
                      {errorMessage}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn-submit-payment"
                    disabled={loadingInvoice !== null}
                  >
                    {loadingInvoice ? 'Processing Payment...' : `Pay ${formatCurrency(selectedInvoice.amount)}`}
                  </button>
                </form>
              </>
            ) : (
              <div className="payment-success">
                <CheckCircle size={64} className="success-icon" />
                <h2>Payment Successful!</h2>
                <p>Your payment of {formatCurrency(selectedInvoice.amount)} has been processed.</p>
                <p className="success-note">Invoice #{selectedInvoice.id} is now paid.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInvoices;