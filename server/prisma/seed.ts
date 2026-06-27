import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

type SeedService = {
  department: {
    name: string;
    slug: string;
    description: string;
  };
  service: {
    slug: string;
    title: string;
    description: string;
    iconKey: string;
    tokenPrefix: string;
    isOpen: boolean;
    averageServiceMinutes: number;
  };
  reasons: string[];
  counters: Array<{
    label: string;
    isActive: boolean;
  }>;
};

const seedServices: SeedService[] = [
  {
    department: {
      name: "Academic Office",
      slug: "academic-office",
      description:
        "Handles academic documents, certificates, transcripts, and student records.",
    },
    service: {
      slug: "document-verification",
      title: "Document Verification",
      description:
        "Verify certificates, forms, transcripts, and other academic documents.",
      iconKey: "file-check",
      tokenPrefix: "DOC",
      isOpen: true,
      averageServiceMinutes: 9,
    },
    reasons: [
      "Bonafide certificate verification",
      "Transcript verification",
      "Scholarship document verification",
      "Internship document verification",
      "Other academic document",
    ],
    counters: [
      {
        label: "Counter 1",
        isActive: true,
      },
      {
        label: "Counter 2",
        isActive: true,
      },
    ],
  },
  {
    department: {
      name: "Health Centre",
      slug: "health-centre",
      description:
        "Provides general consultations and basic healthcare support for students.",
    },
    service: {
      slug: "general-consultation",
      title: "General Consultation",
      description:
        "Join the queue for a general health consultation with campus doctors.",
      iconKey: "stethoscope",
      tokenPrefix: "MED",
      isOpen: true,
      averageServiceMinutes: 8,
    },
    reasons: [
      "General consultation",
      "Follow-up consultation",
      "Prescription renewal",
      "Medical certificate",
      "Minor illness",
    ],
    counters: [
      {
        label: "Doctor Room 1",
        isActive: true,
      },
      {
        label: "Doctor Room 2",
        isActive: true,
      },
      {
        label: "Doctor Room 3",
        isActive: true,
      },
    ],
  },
  {
    department: {
      name: "Central Library",
      slug: "central-library",
      description:
        "Manages issued books, library accounts, pending dues, and clearances.",
    },
    service: {
      slug: "library-clearance",
      title: "Library Clearance",
      description:
        "Submit books, verify pending dues, and complete library clearance.",
      iconKey: "library",
      tokenPrefix: "LIB",
      isOpen: true,
      averageServiceMinutes: 8,
    },
    reasons: [
      "Return issued books",
      "Clear pending dues",
      "Semester clearance",
      "Graduation clearance",
      "Library account issue",
    ],
    counters: [
      {
        label: "Library Desk 1",
        isActive: true,
      },
    ],
  },
  {
    department: {
      name: "Accounts Office",
      slug: "accounts-office",
      description:
        "Handles student fees, receipts, refunds, and scholarship enquiries.",
    },
    service: {
      slug: "fee-enquiries",
      title: "Fee Enquiries",
      description:
        "Resolve payment, scholarship, receipt, and fee-related queries.",
      iconKey: "credit-card",
      tokenPrefix: "ACC",
      isOpen: true,
      averageServiceMinutes: 10,
    },
    reasons: [
      "Fee payment issue",
      "Receipt request",
      "Scholarship status",
      "Refund enquiry",
      "Fee structure clarification",
    ],
    counters: [
      {
        label: "Accounts Counter 1",
        isActive: true,
      },
      {
        label: "Accounts Counter 2",
        isActive: true,
      },
    ],
  },
  {
    department: {
      name: "Hostel Office",
      slug: "hostel-office",
      description:
        "Manages hostel rooms, maintenance requests, leave, and documentation.",
    },
    service: {
      slug: "hostel-services",
      title: "Hostel Services",
      description:
        "Handle room allocation, maintenance, leave, and hostel documentation.",
      iconKey: "building",
      tokenPrefix: "HST",
      isOpen: true,
      averageServiceMinutes: 6,
    },
    reasons: [
      "Room allocation",
      "Maintenance complaint",
      "Hostel leave request",
      "Room change request",
      "Hostel document verification",
    ],
    counters: [
      {
        label: "Hostel Desk 1",
        isActive: true,
      },
      {
        label: "Hostel Desk 2",
        isActive: true,
      },
    ],
  },
  {
    department: {
      name: "Student Affairs",
      slug: "student-affairs",
      description:
        "Supports student identity cards, records, and general student services.",
    },
    service: {
      slug: "id-card-support",
      title: "ID Card Support",
      description:
        "Request a replacement card or resolve student ID-related issues.",
      iconKey: "badge-check",
      tokenPrefix: "ID",
      isOpen: true,
      averageServiceMinutes: 15,
    },
    reasons: [
      "Lost ID card",
      "Damaged ID card",
      "Incorrect student information",
      "New ID card request",
      "ID card activation issue",
    ],
    counters: [
      {
        label: "Student Affairs Desk 1",
        isActive: true,
      },
    ],
  },
];

async function seedDatabase() {
  console.log("Starting CampusFlow database seed...");

  for (const seedItem of seedServices) {
    const department = await prisma.department.upsert({
      where: {
        slug: seedItem.department.slug,
      },
      update: {
        name: seedItem.department.name,
        description: seedItem.department.description,
      },
      create: {
        name: seedItem.department.name,
        slug: seedItem.department.slug,
        description: seedItem.department.description,
      },
    });

    const service = await prisma.service.upsert({
      where: {
        slug: seedItem.service.slug,
      },
      update: {
        title: seedItem.service.title,
        description: seedItem.service.description,
        iconKey: seedItem.service.iconKey,
        tokenPrefix: seedItem.service.tokenPrefix,
        averageServiceMinutes:
          seedItem.service.averageServiceMinutes,
        isOpen: seedItem.service.isOpen,
        departmentId: department.id,
      },
      create: {
        slug: seedItem.service.slug,
        title: seedItem.service.title,
        description: seedItem.service.description,
        iconKey: seedItem.service.iconKey,
        tokenPrefix: seedItem.service.tokenPrefix,
        isOpen: seedItem.service.isOpen,
        averageServiceMinutes:
          seedItem.service.averageServiceMinutes,
        departmentId: department.id,
      },
    });

    for (const [index, reason] of seedItem.reasons.entries()) {
      await prisma.serviceReason.upsert({
        where: {
          serviceId_label: {
            serviceId: service.id,
            label: reason,
          },
        },
        update: {
          position: index + 1,
        },
        create: {
          serviceId: service.id,
          label: reason,
          position: index + 1,
        },
      });
    }

    for (const counter of seedItem.counters) {
      await prisma.counter.upsert({
        where: {
          serviceId_label: {
            serviceId: service.id,
            label: counter.label,
          },
        },
        update: {
          isActive: counter.isActive,
          staffId: null,
        },
        create: {
          serviceId: service.id,
          label: counter.label,
          isActive: counter.isActive,
        },
      });
    }

    console.log(`Seeded: ${seedItem.service.title}`);
  }

  const demoStaffEmail =
    process.env.DEMO_STAFF_EMAIL
      ?.trim()
      .toLowerCase();
  const demoStaffPassword =
    process.env.DEMO_STAFF_PASSWORD;

  if (demoStaffEmail && demoStaffPassword) {
    if (demoStaffPassword.length < 8) {
      throw new Error(
        "DEMO_STAFF_PASSWORD must contain at least 8 characters.",
      );
    }

    const passwordHash = await bcrypt.hash(
      demoStaffPassword,
      12,
    );

    await prisma.user.upsert({
      where: {
        email: demoStaffEmail,
      },
      update: {
        fullName: "Campus Service Staff",
        passwordHash,
        role: "STAFF",
        studentId: null,
        isActive: true,
      },
      create: {
        fullName: "Campus Service Staff",
        email: demoStaffEmail,
        passwordHash,
        role: "STAFF",
        isActive: true,
      },
    });

    console.log(
      `Seeded demo staff account: ${demoStaffEmail}`,
    );
  } else {
    console.log(
      "Skipped demo staff account (set DEMO_STAFF_EMAIL and DEMO_STAFF_PASSWORD to create one).",
    );
  }

  // Keep the demo simple: one shared staff account operates all queues.
  await prisma.counter.updateMany({
    data: {
      staffId: null,
    },
  });

  if (demoStaffEmail) {
    await prisma.user.updateMany({
      where: {
        role: "STAFF",
        email: {
          not: demoStaffEmail,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  const demoAdminEmail =
    process.env.DEMO_ADMIN_EMAIL
      ?.trim()
      .toLowerCase();
  const demoAdminPassword =
    process.env.DEMO_ADMIN_PASSWORD;

  if (demoAdminEmail && demoAdminPassword) {
    if (demoAdminPassword.length < 8) {
      throw new Error(
        "DEMO_ADMIN_PASSWORD must contain at least 8 characters.",
      );
    }

    const passwordHash = await bcrypt.hash(
      demoAdminPassword,
      12,
    );

    await prisma.user.upsert({
      where: {
        email: demoAdminEmail,
      },
      update: {
        fullName: "CampusFlow Administrator",
        passwordHash,
        role: "ADMIN",
        studentId: null,
        isActive: true,
      },
      create: {
        fullName: "CampusFlow Administrator",
        email: demoAdminEmail,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log(
      `Seeded demo admin account: ${demoAdminEmail}`,
    );
  } else {
    console.log(
      "Skipped demo admin account (set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD to create one).",
    );
  }

  const departmentCount = await prisma.department.count();
  const serviceCount = await prisma.service.count();
  const reasonCount = await prisma.serviceReason.count();
  const counterCount = await prisma.counter.count();

  console.log("");
  console.log("CampusFlow database seed completed.");
  console.log(`Departments: ${departmentCount}`);
  console.log(`Services: ${serviceCount}`);
  console.log(`Service reasons: ${reasonCount}`);
  console.log(`Counters: ${counterCount}`);
}

seedDatabase()
  .catch((error: unknown) => {
    console.error("Database seed failed:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });