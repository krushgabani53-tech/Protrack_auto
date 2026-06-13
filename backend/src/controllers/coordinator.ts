import { Request, Response } from 'express';
import { query } from '../config/database.js';

export const exportYearlyReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT 
                g.group_name, g.status as group_status,
                u.email as guide_email,
                json_agg(
                    json_build_object('prn', sp.prn_no, 'roll', sp.roll_no, 'email', su.email)
                ) as students,
                (SELECT total_marks FROM evaluations WHERE group_id = g.group_id AND phase = 'FINAL') as final_marks
             FROM project_groups g
             LEFT JOIN users u ON g.guide_id = u.user_id
             LEFT JOIN group_members m ON g.group_id = m.group_id
             LEFT JOIN student_profiles sp ON m.student_id = sp.student_id
             LEFT JOIN users su ON sp.student_id = su.user_id
             GROUP BY g.group_id, u.email`
        );
        
        // Simple JSON to CSV
        const data = result;
        if (data.length === 0) {
            res.send('No data available');
            return;
        }

        const header = ['Group Name', 'Status', 'Guide Email', 'Final Marks', 'Students'];
        const rows = data.map(row => [
            row.group_name,
            row.group_status,
            row.guide_email || 'Unassigned',
            row.final_marks || 'N/A',
            (row.students || []).map((s: any) => `${s.prn} (${s.email})`).join('; ')
        ]);

        const csvContent = [
            header.join(','),
            ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=yearly_report.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
};

export const getOrphanStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT u.user_id, u.email, sp.prn_no, sp.roll_no
             FROM users u
             JOIN student_profiles sp ON u.user_id = sp.student_id
             LEFT JOIN group_members m ON u.user_id = m.student_id
             WHERE m.group_id IS NULL AND u.role = 'STUDENT'`
        );
        res.json(result);
    } catch (error) {
        console.error('Error fetching orphan students:', error);
        res.status(500).json({ error: 'Failed to fetch orphan students' });
    }
};

export const autoGroupOrphans = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT u.user_id
             FROM users u
             JOIN student_profiles sp ON u.user_id = sp.student_id
             LEFT JOIN group_members m ON u.user_id = m.student_id
             WHERE m.group_id IS NULL AND u.role = 'STUDENT'`
        );
        
        const orphans = result;
        let createdGroups = 0;
        
        // Group in batches of 4
        for (let i = 0; i < orphans.length; i += 4) {
            const batch = orphans.slice(i, i + 4);
            if (batch.length === 0) continue;
            
            const groupName = `Auto Group ${Math.floor(Math.random() * 10000)}`;
            const groupResult = await query(
                `INSERT INTO project_groups (group_name, status) VALUES ($1, 'WAITING_ALLOCATION') RETURNING group_id`,
                [groupName]
            );
            const groupId = groupResult[0].group_id;
            
            for (const student of batch) {
                await query(
                    `INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)`,
                    [groupId, student.user_id, student === batch[0]]
                );
            }
            createdGroups++;
        }

        res.json({ message: 'Auto-grouping successful', groups_created: createdGroups });
    } catch (error) {
        console.error('Error in autoGroupOrphans:', error);
        res.status(500).json({ error: 'Failed to auto-group orphans' });
    }
};
