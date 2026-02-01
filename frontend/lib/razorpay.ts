export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

interface RazorpayPaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  signature: string;
}

export const initiateRazorpayPayment = async (
  amount: number,
  orderData: {
    orderId: string;
    listingId: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    guestMessage: string;
  }
): Promise<RazorpayPaymentResult> => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error('Razorpay Key ID not configured');
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script');
  }

  return new Promise((resolve, reject) => {
    // @ts-ignore
    const razorpay = new window.Razorpay({
      key: keyId,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'AirLite',
      description: 'Booking Reservation',
      order_id: orderData.orderId,
      handler: function (response: any) {
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#FF385C',
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled'));
        },
      },
    });

    razorpay.open();
  });
};
