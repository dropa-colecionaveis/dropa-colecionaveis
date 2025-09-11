const { PrismaClient } = require('@prisma/client')
const { MercadoPagoConfig, Payment } = require('mercadopago')

const prisma = new PrismaClient()

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  }
})

const payment = new Payment(client)

function mapMercadoPagoStatus(mpStatus) {
  switch (mpStatus) {
    case 'approved':
      return 'APPROVED'
    case 'pending':
    case 'in_process':
      return 'PENDING'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

async function checkPendingPayments() {
  console.log('🔍 Checking pending payments...')
  
  try {
    // Get all pending payments from last 24 hours
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            credits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${pendingPayments.length} pending payments`)

    for (const paymentRecord of pendingPayments) {
      console.log(`\n📋 Checking payment ${paymentRecord.id}`)
      console.log(`   External ID: ${paymentRecord.externalId}`)
      console.log(`   User: ${paymentRecord.user?.email}`)
      console.log(`   Amount: R$ ${paymentRecord.amount}`)
      console.log(`   Credits: ${paymentRecord.credits}`)
      
      try {
        // Check status with Mercado Pago
        const mpPaymentDetails = await payment.get({ id: paymentRecord.externalId })
        const newStatus = mapMercadoPagoStatus(mpPaymentDetails.status)
        
        console.log(`   MP Status: ${mpPaymentDetails.status} -> ${newStatus}`)
        
        if (newStatus === 'APPROVED' && paymentRecord.status !== 'APPROVED') {
          console.log('   ✅ Payment approved! Processing...')
          
          // Add credits to user and record transaction
          await prisma.$transaction(async (tx) => {
            // Update user credits
            await tx.user.update({
              where: { id: paymentRecord.userId },
              data: {
                credits: {
                  increment: paymentRecord.credits
                }
              }
            })

            // Record transaction
            await tx.transaction.create({
              data: {
                userId: paymentRecord.userId,
                type: 'PURCHASE_CREDITS',
                amount: paymentRecord.credits,
                description: `Purchased ${paymentRecord.credits} credits for R$ ${paymentRecord.amount} (${paymentRecord.method})`,
              }
            })

            // Update payment status
            await tx.payment.update({
              where: { id: paymentRecord.id },
              data: {
                status: newStatus,
                approvedAt: new Date(),
                mercadoPagoData: {
                  ...paymentRecord.mercadoPagoData,
                  manualUpdate: {
                    originalStatus: mpPaymentDetails.status,
                    updatedAt: new Date().toISOString(),
                    processedBy: 'manual-script'
                  }
                }
              }
            })
          })
          
          // Get updated user credits
          const updatedUser = await prisma.user.findUnique({
            where: { id: paymentRecord.userId },
            select: { credits: true }
          })
          
          console.log(`   💰 Credits added! User now has ${updatedUser?.credits} credits`)
          console.log(`   ✅ Payment ${paymentRecord.id} processed successfully`)
          
        } else if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
          console.log(`   ❌ Payment ${newStatus.toLowerCase()}`)
          
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: {
              status: newStatus,
              failedAt: new Date(),
              failureReason: mpPaymentDetails.status_detail || `Payment ${newStatus.toLowerCase()}`,
              mercadoPagoData: {
                ...paymentRecord.mercadoPagoData,
                manualUpdate: {
                  originalStatus: mpPaymentDetails.status,
                  statusDetail: mpPaymentDetails.status_detail,
                  updatedAt: new Date().toISOString(),
                  processedBy: 'manual-script'
                }
              }
            }
          })
          
          console.log(`   ❌ Payment ${paymentRecord.id} marked as ${newStatus.toLowerCase()}`)
          
        } else {
          console.log(`   ⏳ Payment still ${newStatus}`)
        }
        
      } catch (error) {
        console.error(`   ❌ Error checking payment ${paymentRecord.id}:`, error.message)
      }
    }
    
    console.log('\n✅ Finished checking pending payments')
    
  } catch (error) {
    console.error('Error checking pending payments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPendingPayments()