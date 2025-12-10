export interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  views: string;
  role: "customer" | "handyman" | "all";
  category: string;
  content: {
    intro: string;
    sections: {
      title: string;
      content: string;
      image?: string;
      steps?: string[];
    }[];
    conclusion: string;
  };
}

export const guidesData: Guide[] = [
  {
    id: "1",
    slug: "how-to-book-handyman",
    title: "How to book a handyman for your home",
    description: "Step-by-step guide to finding and booking the right professional",
    image: "/images/getstarted.jpg",
    duration: "5 min",
    views: "12k",
    role: "customer",
    category: "Getting Started",
    content: {
      intro: "Booking a handyman through our platform is quick and easy. Follow these simple steps to get the help you need.",
      sections: [
        {
          title: "Step 1: Search for a Service",
          content: "Start by searching for the type of service you need. You can browse by category or use the search bar to find specific services like 'plumbing', 'electrical work', or 'home repairs'.",
          steps: [
            "Go to the 'Find Handyman' page",
            "Enter your service type in the search bar",
            "Browse through available handymen in your area",
            "Check ratings and reviews for each professional"
          ]
        },
        {
          title: "Step 2: Select a Handyman",
          content: "Review each handyman's profile, including their experience, certifications, and customer reviews. This helps you make an informed decision.",
          steps: [
            "Click on a handyman's profile",
            "Read their bio and service descriptions",
            "Check their ratings and past work photos",
            "Review their availability and response time"
          ]
        },
        {
          title: "Step 3: Choose a Time Slot",
          content: "Select a convenient time for your service. Most handymen offer flexible scheduling to fit your needs.",
          steps: [
            "Click 'Book Now' on the handyman's profile",
            "Select your preferred date and time",
            "Add any special instructions or requirements",
            "Review the service details and pricing"
          ]
        },
        {
          title: "Step 4: Confirm Your Booking",
          content: "Complete your booking by confirming the details. You'll receive a confirmation email with all the information you need.",
          steps: [
            "Review all booking details",
            "Enter your payment information",
            "Click 'Confirm Booking'",
            "Check your email for confirmation"
          ]
        }
      ],
      conclusion: "That's it! Your handyman will arrive at the scheduled time. You can track your booking status and communicate with your handyman through the app."
    }
  },
  {
    id: "2",
    slug: "posting-first-service",
    title: "Posting your first handyman service",
    description: "Learn how to create and publish your service offerings",
    image: "/images/firsthandyman.jpg",
    duration: "8 min",
    views: "8k",
    role: "handyman",
    category: "Getting Started",
    content: {
      intro: "Ready to start offering your services? This guide will walk you through creating your first service listing on our platform.",
      sections: [
        {
          title: "Step 1: Go to Post Service",
          content: "Navigate to the 'Post Service' page from your dashboard. This is where you'll create all your service listings.",
        },
        {
          title: "Step 2: Add Service Details",
          content: "Fill in all the important information about your service. Be detailed and specific to attract the right customers.",
          steps: [
            "Enter a clear, descriptive service title",
            "Write a detailed description of what you offer",
            "Select the appropriate category",
            "Set your pricing (hourly or fixed rate)"
          ]
        },
        {
          title: "Step 3: Upload Photos",
          content: "High-quality photos of your work help customers understand what you can do. Upload your best work samples.",
          steps: [
            "Click 'Upload Images'",
            "Select photos of completed projects",
            "Add captions to explain each photo",
            "Ensure photos are clear and well-lit"
          ]
        },
        {
          title: "Step 4: Publish Your Service",
          content: "Review everything one more time, then publish your service. It will immediately become visible to customers searching for your services.",
          steps: [
            "Review all information for accuracy",
            "Check pricing and availability",
            "Click 'Publish Service'",
            "Share your service on social media"
          ]
        }
      ],
      conclusion: "Congratulations! Your service is now live. Customers can find and book your services. Make sure to respond quickly to booking requests to maintain a good rating."
    }
  },
  {
    id: "3",
    slug: "managing-profile",
    title: "Managing your profile details",
    description: "Keep your information up to date for better matches",
    image: "/images/managing.jpg",
    duration: "3 min",
    views: "15k",
    role: "all",
    category: "Profile",
    content: {
      intro: "Your profile is your first impression. Keeping it updated helps you get better matches and more bookings.",
      sections: [
        {
          title: "Update Basic Information",
          content: "Make sure your name, contact information, and location are current. This helps customers find you and contact you easily.",
        },
        {
          title: "Add Professional Photos",
          content: "A professional profile photo builds trust. For handymen, add photos of your completed work to showcase your skills.",
        },
        {
          title: "Keep Availability Updated",
          content: "Regularly update your availability calendar so customers know when you're free. This reduces booking conflicts.",
        },
        {
          title: "Respond to Reviews",
          content: "Engage with customer reviews. Thank positive reviewers and address any concerns professionally.",
        }
      ],
      conclusion: "A well-maintained profile attracts more customers and helps you build a strong reputation on the platform."
    }
  },
  {
    id: "4",
    slug: "handycover-protection",
    title: "HandyCover protection for customers",
    description: "Understand how our protection plan keeps you covered",
    image: "/images/protection.jpg",
    duration: "6 min",
    views: "10k",
    role: "customer",
    category: "Safety",
    content: {
      intro: "HandyCover is our comprehensive protection plan that gives you peace of mind when booking services through our platform.",
      sections: [
        {
          title: "What's Covered",
          content: "HandyCover protects you against property damage, accidents, and incomplete work. We've got you covered in case something goes wrong.",
          steps: [
            "Property damage up to $10,000",
            "Accidents during service delivery",
            "Incomplete or unsatisfactory work",
            "Theft or loss of property"
          ]
        },
        {
          title: "How to File a Claim",
          content: "If you need to file a claim, the process is simple and straightforward. We're here to help resolve any issues quickly.",
          steps: [
            "Go to your booking details",
            "Click 'Report Issue'",
            "Describe the problem with photos if applicable",
            "Submit your claim for review"
          ]
        },
        {
          title: "Processing Time",
          content: "Most claims are reviewed within 24-48 hours. We'll keep you updated throughout the process.",
        },
        {
          title: "Get Help",
          content: "If you have questions about HandyCover or need assistance filing a claim, our support team is available 24/7.",
        }
      ],
      conclusion: "HandyCover ensures you can book services with confidence, knowing you're protected every step of the way."
    }
  },
  {
  id: "5",
  slug: "managing-payments-refunds",
  title: "Managing payments, changes, and refunds",
  description: "Learn how to handle payments, modify bookings, and request refunds",
  image: "/images/protection.jpg", // You can use a payment-related image if you have one
  duration: "7 min",
  views: "18k",
  role: "all",
  category: "Payments",
  content: {
    intro: "Understanding how payments, booking changes, and refunds work on our platform helps you manage your transactions smoothly. This guide covers everything you need to know.",
    sections: [
      {
        title: "How Payments Work",
        content: "When you book a service, your payment is held securely until the job is completed. This protects both customers and handymen.",
        steps: [
          "Payment is authorized when you confirm a booking",
          "Funds are held securely in our payment system",
          "Payment is released 24-48 hours after job completion",
          "You'll receive a receipt via email"
        ]
      },
      {
        title: "Making Changes to Your Booking",
        content: "Need to reschedule or modify your booking? You can make changes up to 24 hours before the scheduled time.",
        steps: [
          "Go to your 'Bookings' page",
          "Find the booking you want to modify",
          "Click 'Edit' or 'Reschedule'",
          "Select new date/time or update details",
          "Confirm the changes"
        ]
      },
      {
        title: "Canceling a Booking",
        content: "You can cancel bookings at any time, but cancellation policies may apply depending on timing.",
        steps: [
          "Open your booking details",
          "Click 'Cancel Booking'",
          "Select reason for cancellation",
          "Review refund policy",
          "Confirm cancellation"
        ]
      },
      {
        title: "Understanding Refund Policies",
        content: "Refund eligibility depends on when you cancel and the handyman's policy. Here's what you need to know:",
        steps: [
          "Cancel 24+ hours before: Full refund",
          "Cancel 12-24 hours before: 50% refund",
          "Cancel less than 12 hours: No refund (unless handyman cancels)",
          "If handyman cancels: Full refund automatically",
          "If work is unsatisfactory: File a dispute for review"
        ]
      },
      {
        title: "Requesting a Refund",
        content: "If you need a refund, the process is straightforward. Our support team reviews all refund requests.",
        steps: [
          "Go to your booking details",
          "Click 'Request Refund'",
          "Select reason for refund",
          "Add any supporting details or photos",
          "Submit your request",
          "Wait for review (usually 24-48 hours)"
        ]
      },
      {
        title: "For Handymen: Getting Paid",
        content: "As a handyman, you'll receive payment after completing jobs. Here's how the payment process works for you:",
        steps: [
          "Complete the job and mark it as done",
          "Customer confirms completion",
          "Payment is released 24-48 hours after confirmation",
          "Funds are transferred to your registered account",
          "You'll receive a payment notification"
        ]
      },
      {
        title: "Disputes and Issues",
        content: "If there's a disagreement about payment or service quality, you can file a dispute. Our team will mediate and ensure a fair resolution.",
        steps: [
          "Go to your booking",
          "Click 'Report Issue' or 'File Dispute'",
          "Describe the problem in detail",
          "Upload any relevant photos or documents",
          "Submit for review",
          "Our team will contact both parties within 24 hours"
        ]
      }
    ],
    conclusion: "Understanding payment processes helps ensure smooth transactions for everyone. If you have questions or need help with a payment issue, our support team is available 24/7 to assist you."
  }
}
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guidesData.find(guide => guide.slug === slug);
}

export function getGuidesByRole(role: "customer" | "handyman" | "all"): Guide[] {
  if (role === "all") return guidesData;
  return guidesData.filter(guide => guide.role === role || guide.role === "all");
}