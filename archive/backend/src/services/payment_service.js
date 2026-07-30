import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PaymentService {
  constructor() {
    this.hesabPayApiKey = process.env.HESABPAY_API_KEY;
    this.hesabPayMerchantId = process.env.HESABPAY_MERCHANT_ID;
    this.hesabPayBaseUrl = process.env.HESABPAY_BASE_URL || 'https://api.hesabpay.af';
    this.mockMode = !this.hesabPayApiKey || this.hesabPayApiKey.includes('your-');
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(amount, currency = 'AFN', metadata = {}) {
    if (this.mockMode) {
      return this._mockCreatePaymentIntent(amount, currency, metadata);
    }

    try {
      const response = await axios.post(
        `${this.hesabPayBaseUrl}/v1/payments`,
        {
          amount,
          currency,
          merchant_id: this.hesabPayMerchantId,
          metadata,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.hesabPayApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
      };
    } catch (error) {
      console.error('HesabPay payment creation error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentId, paymentMethod = 'card') {
    if (this.mockMode) {
      return this._mockConfirmPayment(paymentId, paymentMethod);
    }

    try {
      const response = await axios.post(
        `${this.hesabPayBaseUrl}/v1/payments/${paymentId}/confirm`,
        {
          payment_method: paymentMethod,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.hesabPayApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        status: response.data.status,
        transactionId: response.data.transaction_id,
      };
    } catch (error) {
      console.error('HesabPay payment confirmation error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    if (this.mockMode) {
      return this._mockGetPaymentStatus(paymentId);
    }

    try {
      const response = await axios.get(
        `${this.hesabPayBaseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.hesabPayApiKey}`,
          },
        }
      );

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
      };
    } catch (error) {
      console.error('HesabPay payment status error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount = null) {
    if (this.mockMode) {
      return this._mockRefundPayment(paymentId, amount);
    }

    try {
      const response = await axios.post(
        `${this.hesabPayBaseUrl}/v1/payments/${paymentId}/refund`,
        {
          amount,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.hesabPayApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        status: response.data.status,
        amount: response.data.amount,
      };
    } catch (error) {
      console.error('HesabPay refund error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mock implementations for development
  _mockCreatePaymentIntent(amount, currency, metadata) {
    const paymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    console.log(`💳 [MOCK] Creating payment intent: ${paymentId} for ${amount} ${currency}`);
    
    return {
      success: true,
      paymentId,
      status: 'pending',
      amount,
      currency,
      metadata,
      mockMode: true,
    };
  }

  _mockConfirmPayment(paymentId, paymentMethod) {
    console.log(`💳 [MOCK] Confirming payment: ${paymentId} with method: ${paymentMethod}`);
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        status: 'completed',
        transactionId: `txn_mock_${Date.now()}`,
        mockMode: true,
      };
    } else {
      return {
        success: false,
        error: 'Payment declined (mock)',
        mockMode: true,
      };
    }
  }

  _mockGetPaymentStatus(paymentId) {
    console.log(`💳 [MOCK] Getting payment status: ${paymentId}`);
    
    return {
      success: true,
      status: 'completed',
      amount: 1000,
      currency: 'AFN',
      mockMode: true,
    };
  }

  _mockRefundPayment(paymentId, amount) {
    console.log(`💳 [MOCK] Refunding payment: ${paymentId}, amount: ${amount || 'full'}`);
    
    return {
      success: true,
      refundId: `ref_mock_${Date.now()}`,
      status: 'refunded',
      amount: amount || 1000,
      mockMode: true,
    };
  }
}

export default new PaymentService();
