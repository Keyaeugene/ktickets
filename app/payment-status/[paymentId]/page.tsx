export default async function PaymentStatusPage({ 
  params 
}: { 
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params;
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Status</h1>
      <p>Payment ID: {paymentId}</p>
      {/* Add your payment status logic here */}
    </div>
  );
}