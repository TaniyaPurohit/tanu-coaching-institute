import { Batch, Student } from '../types';

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportStudentsToCSV(students: Student[], batches: Batch[]): void {
  const batchMap = new Map(batches.map((b) => [b.id, b.name]));

  const headers = [
    'Student ID',
    'Full Name',
    'Phone',
    'Email',
    'Guardian Name',
    'Guardian Phone',
    'Batch Name',
    'Batch ID',
    'Date of Birth',
    'Joining Date',
    'Total Fee',
    'Discount',
    'Fee Plan Type',
    'Installments Count',
    'Status',
    'Address',
    'Notes',
  ];

  const rows = students.map((s) => [
    escapeCsv(s.id),
    escapeCsv(s.name),
    escapeCsv(s.phone),
    escapeCsv(s.email),
    escapeCsv(s.guardianName),
    escapeCsv(s.guardianPhone),
    escapeCsv(batchMap.get(s.batchId) || s.batchId),
    escapeCsv(s.batchId),
    escapeCsv(s.dob),
    escapeCsv(s.joiningDate),
    escapeCsv(s.feePlan?.totalFee || 0),
    escapeCsv(s.feePlan?.discount || 0),
    escapeCsv(s.feePlan?.planType || 'one-time'),
    escapeCsv(s.feePlan?.installmentsCount || 1),
    escapeCsv(s.status),
    escapeCsv(s.address),
    escapeCsv(s.notes || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `edutrack_students_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSampleStudentCSV(): void {
  const sampleHeaders = [
    'Full Name',
    'Phone',
    'Email',
    'Guardian Name',
    'Guardian Phone',
    'Batch ID or Name',
    'Date of Birth',
    'Joining Date',
    'Total Fee',
    'Discount',
    'Fee Plan Type',
    'Installments',
    'Status',
    'Address',
    'Notes',
  ];

  const sampleRows = [
    [
      '"Aarav Gupta"',
      '"9811002233"',
      '"aarav.gupta@example.com"',
      '"Naresh Gupta (Father)"',
      '"9811002234"',
      '"BATCH-01"',
      '"2007-05-15"',
      '"2024-08-01"',
      '"45000"',
      '"2000"',
      '"quarterly"',
      '"3"',
      '"active"',
      '"402 Lake View Apts, Powai, Mumbai"',
      '"Enrolled after scholarship exam"',
    ],
    [
      '"Simran Kaur"',
      '"9822334455"',
      '"simran.k@example.com"',
      '"Gurpreet Kaur (Mother)"',
      '"9822334456"',
      '"BATCH-02"',
      '"2007-09-20"',
      '"2024-08-05"',
      '"50000"',
      '"0"',
      '"monthly"',
      '"6"',
      '"active"',
      '"12 Sector 18, Chandigarh"',
      '"Aims for AIIMS entrance"',
    ],
  ];

  const csvContent = [sampleHeaders.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_students_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseStudentCSV(
  csvText: string,
  batches: Batch[],
  existingStudents: Student[]
): { validStudents: Omit<Student, 'id'>[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const errors: string[] = [];
  const validStudents: Omit<Student, 'id'>[] = [];

  if (lines.length < 2) {
    return { validStudents: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  const rawHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const nameIdx = rawHeaders.findIndex((h) => h.includes('name') && !h.includes('guardian'));
  const phoneIdx = rawHeaders.findIndex((h) => h.includes('phone') && !h.includes('guardian'));
  const emailIdx = rawHeaders.findIndex((h) => h.includes('email'));
  const guardianNameIdx = rawHeaders.findIndex((h) => h.includes('guardianname') || h.includes('parentname'));
  const guardianPhoneIdx = rawHeaders.findIndex((h) => h.includes('guardianphone') || h.includes('parentphone'));
  const batchIdx = rawHeaders.findIndex((h) => h.includes('batch'));
  const dobIdx = rawHeaders.findIndex((h) => h.includes('dob') || h.includes('birth'));
  const joinIdx = rawHeaders.findIndex((h) => h.includes('join') || h.includes('admission'));
  const feeIdx = rawHeaders.findIndex((h) => h.includes('fee') && !h.includes('plan'));
  const discountIdx = rawHeaders.findIndex((h) => h.includes('discount'));
  const planTypeIdx = rawHeaders.findIndex((h) => h.includes('plan'));
  const installmentsIdx = rawHeaders.findIndex((h) => h.includes('installment'));
  const statusIdx = rawHeaders.findIndex((h) => h.includes('status'));
  const addressIdx = rawHeaders.findIndex((h) => h.includes('address'));
  const notesIdx = rawHeaders.findIndex((h) => h.includes('note'));

  if (nameIdx === -1 || phoneIdx === -1) {
    return {
      validStudents: [],
      errors: ['Required columns "Full Name" and "Phone" were not found in the CSV header.'],
    };
  }

  const seenPhones = new Set(existingStudents.map((s) => s.phone.trim()));

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const rowNum = i + 1;

    const name = cols[nameIdx]?.trim();
    const phone = cols[phoneIdx]?.trim();

    if (!name) {
      errors.push(`Row ${rowNum}: Student Name is missing.`);
      continue;
    }

    if (!phone) {
      errors.push(`Row ${rowNum} (${name}): Phone number is missing.`);
      continue;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      errors.push(`Row ${rowNum} (${name}): Invalid phone number '${phone}'. Must have 8-15 digits.`);
      continue;
    }

    if (seenPhones.has(cleanPhone)) {
      errors.push(`Row ${rowNum} (${name}): Phone number '${cleanPhone}' already exists.`);
      continue;
    }

    let batchId = batches[0]?.id || 'BATCH-01';
    if (batchIdx !== -1 && cols[batchIdx]) {
      const batchInput = cols[batchIdx].trim().toLowerCase();
      const matched = batches.find(
        (b) => b.id.toLowerCase() === batchInput || b.name.toLowerCase().includes(batchInput)
      );
      if (matched) {
        batchId = matched.id;
      }
    }

    const email = (emailIdx !== -1 ? cols[emailIdx] : '') || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const guardianName = (guardianNameIdx !== -1 ? cols[guardianNameIdx] : '') || 'Parent / Guardian';
    const guardianPhone = (guardianPhoneIdx !== -1 ? cols[guardianPhoneIdx] : '') || cleanPhone;
    const dob = (dobIdx !== -1 && cols[dobIdx]) ? cols[dobIdx] : '2007-01-01';
    const joiningDate = (joinIdx !== -1 && cols[joinIdx]) ? cols[joinIdx] : new Date().toISOString().split('T')[0];

    const rawFee = feeIdx !== -1 ? parseFloat(cols[feeIdx]) : 0;
    const batchFee = batches.find((b) => b.id === batchId)?.baseFee || 35000;
    const totalFee = isNaN(rawFee) || rawFee <= 0 ? batchFee : rawFee;

    const rawDiscount = discountIdx !== -1 ? parseFloat(cols[discountIdx]) : 0;
    const discount = isNaN(rawDiscount) || rawDiscount < 0 ? 0 : rawDiscount;

    const planTypeRaw = planTypeIdx !== -1 ? cols[planTypeIdx]?.toLowerCase() : 'quarterly';
    const planType = ['one-time', 'monthly', 'quarterly', 'custom'].includes(planTypeRaw)
      ? (planTypeRaw as any)
      : 'quarterly';

    const rawInstallments = installmentsIdx !== -1 ? parseInt(cols[installmentsIdx]) : 3;
    const installmentsCount = isNaN(rawInstallments) || rawInstallments <= 0 ? 3 : rawInstallments;

    const statusRaw = statusIdx !== -1 ? cols[statusIdx]?.toLowerCase() : 'active';
    const status = statusRaw === 'inactive' ? 'inactive' : 'active';

    const address = (addressIdx !== -1 ? cols[addressIdx] : '') || 'Not provided';
    const notes = notesIdx !== -1 ? cols[notesIdx] : '';

    seenPhones.add(cleanPhone);

    validStudents.push({
      name,
      phone: cleanPhone,
      email,
      guardianName,
      guardianPhone,
      address,
      dob,
      batchId,
      joiningDate,
      feePlan: {
        totalFee,
        discount,
        planType,
        installmentsCount,
      },
      status,
      notes,
    });
  }

  return { validStudents, errors };
}
