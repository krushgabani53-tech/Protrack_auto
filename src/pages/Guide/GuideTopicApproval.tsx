import { TopicReviewShell } from '../shared/TopicApprovalComponents';

export const GuideTopicApproval: React.FC = () => (
    <TopicReviewShell
        currentPage="/guide/topics"
        title="Topic Approvals"
        subtitle="Review and approve student project topics for your assigned groups (Priority 1 → 2 → 3)"
        iconColor="bg-gradient-to-br from-purple-500 to-pink-500"
        stage="GUIDE"
        emptyMsg="No topics awaiting your review. All clear!"
    />
);

import React from 'react';
