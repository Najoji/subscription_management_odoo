import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoicePrintView from '../../components/invoices/InvoicePrintView.jsx';
import RecordPaymentModal from '../../components/payments/RecordPaymentModal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { invoiceApi } from '../../api/invoiceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ArrowLeft, CheckCircle2, XCircle, CreditCard } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const basePath = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/portal';
  const isCustomer = role === 'customer';

  const loadInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getInvoiceById(id);
      if (res?.data) {
        setInvoice(res.data);
      } else {
        throw new Error('Invoice not found');
      }
    } catch (err) {
      error(err.message || 'Failed to load invoice details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleConfirmInvoice = async () => {
    setIsProcessing(true);
    try {
      await invoiceApi.confirmInvoice(id);
      success('Invoice confirmed successfully and ready for payment.');
      setConfirmDialogOpen(false);
      loadInvoice();
    } catch (err) {
      error(err.message || 'Failed to confirm invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelInvoice = async () => {
    setIsProcessing(true);
    try {
      await invoiceApi.cancelInvoice(id);
      success('Invoice cancelled.');
      setCancelDialogOpen(false);
      loadInvoice();
    } catch (err) {
      error(err.message || 'Failed to cancel invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading invoice document..." className="min-h-[60vh]" />;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Invoice not found.</p>
        <Button onClick={() => navigate(`${basePath}/invoices`)} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isDraft = invoice.status === 'Draft';
  const isConfirmed = invoice.status === 'Confirmed';
  const isPaid = invoice.status === 'Paid';
  const isCancelled = invoice.status === 'Cancelled';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(`${basePath}/invoices`)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </button>

        <div className="flex items-center gap-2">
          {!isCustomer && isDraft && (
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={() => setConfirmDialogOpen(true)}
            >
              Confirm Invoice
            </Button>
          )}

          {!isCustomer && (isDraft || isConfirmed) && (
            <Button
              size="sm"
              variant="outline"
              icon={XCircle}
              onClick={() => setCancelDialogOpen(true)}
              className="text-rose-400 hover:text-rose-300"
            >
              Cancel
            </Button>
          )}

          {!isCustomer && !isPaid && !isCancelled && (
            <Button
              size="sm"
              variant="success"
              icon={CreditCard}
              onClick={() => setPaymentModalOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice Document */}
      <InvoicePrintView
        invoice={invoice}
        onRecordPayment={!isCustomer && !isPaid && !isCancelled ? () => setPaymentModalOpen(true) : null}
      />

      {/* Payment Recording Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={() => loadInvoice()}
      />

      {/* Confirm Invoice Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmInvoice}
        title="Confirm Invoice"
        message="Confirming this invoice validates all line snapshot totals and opens it for payment recording."
        type="info"
        confirmText="Confirm Invoice"
        isLoading={isProcessing}
      />

      {/* Cancel Invoice Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelInvoice}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? Cancelled invoices cannot receive payments."
        type="danger"
        confirmText="Yes, Cancel"
        isLoading={isProcessing}
      />
    </div>
  );
}
