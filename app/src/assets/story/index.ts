import handoverAgreement from './handover-agreement.webp'
import leakagePhoto from './leakage-photo.webp'
import paymentReceipt from './payment-receipt.webp'
import rinaAvatar from './rina-avatar.webp'

export const storyAssets = {
  customerAvatar: {
    alt: 'Rina Putri, simulated customer',
    src: rinaAvatar,
  },
  attachments: {
    'att-photo': {
      alt: 'Preview of ceiling leakage evidence',
      icon: 'file-image' as const,
      src: leakagePhoto,
    },
    'att-handover': {
      alt: 'Preview of the fictional handover agreement',
      icon: 'file-text' as const,
      src: handoverAgreement,
    },
    'att-receipt': {
      alt: 'Preview of the fictional payment receipt',
      icon: 'file-text' as const,
      src: paymentReceipt,
    },
  },
} as const

export type StoryAttachmentId = keyof typeof storyAssets.attachments
