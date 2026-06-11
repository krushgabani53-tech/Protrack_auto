import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

import xlsx from 'xlsx';

export async function uploadWhitelist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const originalName = req.file.originalname.toLowerCase();
        let results: any[] = [];

        if (originalName.endsWith('.csv')) {
            const bufferStream = new Readable();
            bufferStream.push(req.file.buffer);
            bufferStream.push(null);

            bufferStream
                .pipe(csvParser())
                .on('data', (data) => results.push(data))
                .on('end', () => processResults(results, res));
        } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
            try {
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                results = xlsx.utils.sheet_to_json(worksheet);
                await processResults(results, res);
            } catch (err) {
                console.error("Excel parse error:", err);
                res.status(400).json({ error: 'Invalid Excel file format' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported file type. Please upload a .csv or .xlsx file.' });
        }
    } catch (error) {
        console.error('Upload whitelist error:', error);
        res.status(500).json({ error: 'Failed to process whitelist upload' });
    }
}

async function processResults(results: any[], res: Response) {
    let successCount = 0;
    let errorCount = 0;

    for (const row of results) {
        const prn_no = row.prn_no || row.PRN || row.prn;
        const email = row.email || row.Email || row.EMAIL;
        const full_name = row.full_name || row.name || row.Name || row.NAME;

        if (!prn_no || !email || !full_name) {
            errorCount++;
            continue;
        }

        try {
            await query(
                `INSERT INTO student_whitelist (prn_no, email, full_name)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (prn_no) DO NOTHING`,
                [prn_no, email, full_name]
            );
            successCount++;
        } catch (dbErr) {
            console.error('Error inserting row:', dbErr);
            errorCount++;
        }
    }

    res.status(200).json({
        message: 'Upload completed',
        totalProcessed: results.length,
        successCount,
        errorCount
    });
}

export async function getWhitelist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const whitelist = await query(
            'SELECT id, prn_no, email, full_name, is_claimed, created_at FROM student_whitelist ORDER BY created_at DESC'
        );
        res.status(200).json(whitelist);
    } catch (error) {
        console.error('Fetch whitelist error:', error);
        res.status(500).json({ error: 'Failed to fetch whitelist' });
    }
}

// ---------------------------------------------------------------
// Faculty Whitelist
// ---------------------------------------------------------------

export async function uploadFacultyWhitelist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const originalName = req.file.originalname.toLowerCase();
        let results: any[] = [];

        if (originalName.endsWith('.csv')) {
            const bufferStream = new Readable();
            bufferStream.push(req.file.buffer);
            bufferStream.push(null);

            bufferStream
                .pipe(csvParser())
                .on('data', (data) => results.push(data))
                .on('end', () => processFacultyResults(results, res));
        } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
            try {
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                results = xlsx.utils.sheet_to_json(worksheet);
                await processFacultyResults(results, res);
            } catch (err) {
                console.error('Excel parse error:', err);
                res.status(400).json({ error: 'Invalid Excel file format' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported file type. Please upload a .csv or .xlsx file.' });
        }
    } catch (error) {
        console.error('Upload faculty whitelist error:', error);
        res.status(500).json({ error: 'Failed to process faculty whitelist upload' });
    }
}

async function processFacultyResults(results: any[], res: Response) {
    let successCount = 0;
    let errorCount = 0;

    const validRoles = ['GUIDE', 'COORDINATOR', 'COMMITTEE'];

    for (const row of results) {
        const email       = row.email       || row.Email       || row.EMAIL;
        const employee_id = row.employee_id || row.EmployeeId  || row.EMPLOYEE_ID || null;
        const full_name   = row.full_name   || row.name        || row.Name || row.NAME;
        const role        = (row.role       || row.Role        || row.ROLE || '').toUpperCase();

        if (!email || !full_name || !validRoles.includes(role)) {
            errorCount++;
            continue;
        }

        try {
            await query(
                `INSERT INTO faculty_whitelist (email, employee_id, full_name, role)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO NOTHING`,
                [email, employee_id, full_name, role]
            );
            successCount++;
        } catch (dbErr) {
            console.error('Error inserting faculty row:', dbErr);
            errorCount++;
        }
    }

    res.status(200).json({
        message: 'Faculty whitelist upload completed',
        totalProcessed: results.length,
        successCount,
        errorCount
    });
}

export async function getFacultyWhitelist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const whitelist = await query(
            'SELECT id, email, employee_id, full_name, role, is_claimed, created_at FROM faculty_whitelist ORDER BY created_at DESC'
        );
        res.status(200).json(whitelist);
    } catch (error) {
        console.error('Fetch faculty whitelist error:', error);
        res.status(500).json({ error: 'Failed to fetch faculty whitelist' });
    }
}
