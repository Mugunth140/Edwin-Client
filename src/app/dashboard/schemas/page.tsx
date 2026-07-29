'use client';

import { Card, Flex, Table, Typography } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { cardClassName, pageHeaderClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

type ColumnDef = {
  column: string;
  type: string;
  nullable: string;
  default: string;
  description: string;
};

const salarySchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'grades', type: 'character varying', nullable: 'NO', default: '-', description: 'Employee grade (e.g. Grade A)' },
  { column: 'expInYears', type: 'character varying', nullable: 'NO', default: '-', description: 'Experience range (e.g. 2-4, 5-7, 15+)' },
  { column: 'monthlySalary', type: 'decimal(12,2)', nullable: 'NO', default: '-', description: 'Monthly salary amount' },
  { column: 'avgCostPerHr', type: 'decimal(10,2)', nullable: 'NO', default: '-', description: 'Average cost per hour' },
  { column: 'bookingCost', type: 'decimal(12,2)', nullable: 'NO', default: '-', description: 'Booking cost' },
  { column: 'isDeleted', type: 'boolean', nullable: 'NO', default: 'false', description: 'Soft delete flag' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record creation timestamp' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record update timestamp' },
];

const usersSchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'name', type: 'character varying', nullable: 'NO', default: '-', description: 'User full name' },
  { column: 'email', type: 'character varying', nullable: 'NO', default: '-', description: 'Login email (unique)' },
  { column: 'username', type: 'character varying', nullable: 'YES', default: '-', description: 'Login username (unique)' },
  { column: 'employeeId', type: 'character varying', nullable: 'YES', default: '-', description: 'Employee ID' },
  { column: 'phone', type: 'character varying', nullable: 'YES', default: '-', description: 'Phone number' },
  { column: 'address', type: 'text', nullable: 'YES', default: '-', description: 'Address' },
  { column: 'passwordHash', type: 'character varying', nullable: 'NO', default: '-', description: 'Bcrypt password hash' },
  { column: 'role', type: 'enum', nullable: 'NO', default: 'viewer', description: 'User role (admin, site_engineer, accounts_manager, purchase_team, viewer)' },
  { column: 'isActive', type: 'boolean', nullable: 'NO', default: 'true', description: 'Account active status' },
  { column: 'salaryGradeId', type: 'uuid', nullable: 'YES', default: '-', description: 'FK to salaries.id' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record creation timestamp' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record update timestamp' },
];

const weeklyTimesheetSchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'siteEngineerId', type: 'uuid', nullable: 'NO', default: '-', description: 'FK to users.id (ManyToOne -> User)' },
  { column: 'weekStart', type: 'date', nullable: 'NO', default: '-', description: 'Week start Monday' },
  { column: 'weekEnd', type: 'date', nullable: 'NO', default: '-', description: 'Week end Sunday' },
  { column: 'totalHours', type: 'decimal(10,2)', nullable: 'NO', default: '0', description: 'Total hours' },
  { column: 'status', type: 'varchar', nullable: 'NO', default: 'draft', description: 'draft/submitted/approved/rejected' },
  { column: 'approvedById', type: 'varchar', nullable: 'YES', default: '-', description: 'FK to users.id (who verified/approved)' },
  { column: 'approvedAt', type: 'date', nullable: 'YES', default: '-', description: 'Verification/approval timestamp' },
  { column: 'isDeleted', type: 'boolean', nullable: 'NO', default: 'false', description: 'Soft delete' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: '' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: '' },
];

const timesheetRowSchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'timesheetId', type: 'uuid', nullable: 'NO', default: '-', description: 'FK to weekly_timesheets.id' },
  { column: 'projectId', type: 'uuid', nullable: 'YES', default: '-', description: 'FK to projects.id' },
  { column: 'entryType', type: 'varchar', nullable: 'NO', default: 'project', description: "project / holiday / idle / leave" },
  { column: 'remark', type: 'text', nullable: 'YES', default: '-', description: 'Site engineer note for this row (e.g. reason for leave/idle time, work notes)' },
  { column: 'amount', type: 'decimal(12,2)', nullable: 'NO', default: '0', description: 'Calculated cost amount (set on approval)' },
  { column: 'monHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Monday hours' },
  { column: 'tueHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Tuesday hours' },
  { column: 'wedHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Wednesday hours' },
  { column: 'thuHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Thursday hours' },
  { column: 'friHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Friday hours' },
  { column: 'satHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Saturday hours' },
  { column: 'sunHours', type: 'decimal(5,2)', nullable: 'NO', default: '0', description: 'Sunday hours' },
  { column: 'isDeleted', type: 'boolean', nullable: 'NO', default: 'false', description: 'Soft delete' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: '' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: '' },
];

const projectCategorySchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'name', type: 'character varying', nullable: 'NO', default: '-', description: 'Category name, e.g. Residential, Commercial, Institutional, Infrastructure (unique)' },
  { column: 'isDeleted', type: 'boolean', nullable: 'NO', default: 'false', description: 'Soft delete flag' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record creation timestamp' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record update timestamp' },
];

const materialRequirementsSchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'enquiryNo', type: 'character varying', nullable: 'NO', default: '-', description: 'Unique material requirement number' },
  { column: 'vendorId', type: 'uuid', nullable: 'NO', default: '-', description: 'FK to vendors.id' },
  { column: 'projectId', type: 'uuid', nullable: 'NO', default: '-', description: 'FK to projects.id' },
  { column: 'notes', type: 'text', nullable: 'YES', default: '-', description: 'Additional notes' },
  { column: 'items', type: 'jsonb', nullable: 'NO', default: '[]', description: 'Array of { description, quantity }' },
  { column: 'status', type: 'varchar(50)', nullable: 'NO', default: 'draft', description: 'draft / pending / approved / rejected' },
  { column: 'isDeleted', type: 'boolean', nullable: 'NO', default: 'false', description: 'Soft delete flag' },
  { column: 'createdBy', type: 'uuid', nullable: 'YES', default: '-', description: 'FK to users.id (site engineer who created it)' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record creation timestamp' },
  { column: 'updatedAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record update timestamp' },
];

const projectsSchema: ColumnDef[] = [
  { column: 'id', type: 'uuid', nullable: 'NO', default: 'gen_random_uuid()', description: 'Primary key' },
  { column: 'name', type: 'character varying', nullable: 'NO', default: '-', description: 'Project name' },
  { column: 'projectCode', type: 'character varying', nullable: 'NO', default: '-', description: 'Unique project code' },
  { column: 'status', type: 'enum', nullable: 'NO', default: 'planning', description: 'planning / in_progress / on_hold / completed' },
  { column: 'projectCategoryId', type: 'uuid', nullable: 'YES', default: '-', description: 'FK to project_categories.id' },
  { column: 'projectNature', type: 'enum', nullable: 'YES', default: '-', description: 'brownfield / greenfield' },
  { column: 'jobType', type: 'enum', nullable: 'YES', default: '-', description: 'contracting / design_build / design' },
  { column: 'jobStatus', type: 'enum', nullable: 'NO', default: 'bidding', description: 'bidding / awarded' },
  { column: 'financialYear', type: 'character varying', nullable: 'YES', default: '-', description: 'e.g. 2026-2027' },
  { column: 'dateOfCreation', type: 'date', nullable: 'YES', default: '-', description: 'Manually set project creation date' },
  { column: 'createdAt', type: 'timestamp', nullable: 'NO', default: 'now()', description: 'Record creation timestamp (system-managed)' },
];

const schemaList = [
  { table: 'salaries', columns: salarySchema, description: 'Salary grade master table' },
  { table: 'users', columns: usersSchema, description: 'All users' },
  { table: 'weekly_timesheets', columns: weeklyTimesheetSchema, description: 'Weekly timesheet header (one per engineer per week)' },
  { table: 'timesheet_rows', columns: timesheetRowSchema, description: 'One row per project (or per Holiday/Idle/Leave category) per week, with hours mapped to monHours..sunHours columns and an optional remark. A single day can have hours split across multiple project rows.' },
  { table: 'project_categories', columns: projectCategorySchema, description: 'Admin-editable project category master table' },
  { table: 'material_requirements', columns: materialRequirementsSchema, description: 'Material requirement requests raised by site engineers' },
  { table: 'projects', columns: projectsSchema, description: 'New classification columns added to the existing projects table' },
];

const colDefColumns: ColumnsType<ColumnDef> = [
  { title: 'Column', dataIndex: 'column', width: 160, render: (v) => <Typography.Text code>{v}</Typography.Text> },
  { title: 'Type', dataIndex: 'type', width: 160, render: (v) => <Typography.Text code>{v}</Typography.Text> },
  { title: 'Nullable', dataIndex: 'nullable', width: 80 },
  { title: 'Default', dataIndex: 'default', width: 180, render: (v) => <Typography.Text code>{v}</Typography.Text> },
  { title: 'Description', dataIndex: 'description' },
];

export default function SchemasPage() {
  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName}>
        <Typography.Title level={3} className={pageTitleClassName}>
          <DatabaseOutlined className={titleIconClassName} /> Database Schemas Reference
        </Typography.Title>
      </Flex>

      <Typography.Paragraph className="mb-6 text-[var(--text-muted)]">
        Reference for database tables. Create this table on your server by running the entity migration or using TypeORM synchronize.
      </Typography.Paragraph>

      {schemaList.map((schema, idx) => (
        <Card
          key={schema.table}
          className={cardClassName}
          title={
            <Flex align="center" gap={8}>
              <DatabaseOutlined className="text-sky-400" />
              <Typography.Text strong className="text-[var(--text-primary)] text-base">
                {schema.table}
              </Typography.Text>
            </Flex>
          }
          extra={<Typography.Text type="secondary">{schema.description}</Typography.Text>}
          style={{ marginBottom: 24 }}
        >
          <Table
            dataSource={schema.columns}
            columns={colDefColumns}
            rowKey="column"
            size="small"
            pagination={false}
          />

          {idx === 0 && (
            <>
              <Typography.Paragraph className="mt-4 text-[var(--text-very-muted)] text-sm">
                <strong>SQL CREATE TABLE reference:</strong>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`CREATE TABLE salaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grades          VARCHAR NOT NULL,
  "expInYears"    VARCHAR NOT NULL,
  "monthlySalary" DECIMAL(12,2) NOT NULL,
  "avgCostPerHr"  DECIMAL(10,2) NOT NULL,
  "bookingCost"   DECIMAL(12,2) NOT NULL,
  "isDeleted"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now()
);`}
                </pre>
              </Typography.Paragraph>
            </>
          )}

          {idx === 1 && (
            <>
              <Typography.Paragraph className="mt-4 text-[var(--text-very-muted)] text-sm">
                <strong>SQL DDL & ALTER reference:</strong>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`-- Add salaryGradeId column if missing on existing users table:
ALTER TABLE users
  ADD COLUMN "salaryGradeId" UUID NULL,
  ADD CONSTRAINT fk_users_salary_grade FOREIGN KEY ("salaryGradeId") REFERENCES salaries(id);

-- Full CREATE TABLE (for new setups):
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR NOT NULL,
  email           VARCHAR NOT NULL UNIQUE,
  username        VARCHAR UNIQUE,
  "employeeId"    VARCHAR,
  phone           VARCHAR,
  address         TEXT,
  "passwordHash"  VARCHAR NOT NULL,
  role            VARCHAR NOT NULL DEFAULT 'viewer',
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "salaryGradeId" UUID REFERENCES salaries(id),
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now()
);`}
                </pre>
              </Typography.Paragraph>
            </>
          )}

          {idx === 2 && (
            <Typography.Paragraph>
              <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`CREATE TABLE weekly_timesheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "siteEngineerId" UUID NOT NULL REFERENCES users(id),
  "weekStart"      DATE NOT NULL,
  "weekEnd"        DATE NOT NULL,
  "totalHours"     DECIMAL(10,2) NOT NULL DEFAULT 0,
  status           VARCHAR NOT NULL DEFAULT 'draft',
  "approvedById"   VARCHAR NULL,
  "approvedAt"     DATE NULL,
  "isDeleted"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT now()
);`}
              </pre>
            </Typography.Paragraph>
          )}
          {idx === 3 && (
            <>
              <Typography.Paragraph>
                <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`CREATE TABLE timesheet_rows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timesheetId" UUID NOT NULL REFERENCES weekly_timesheets(id),
  "projectId"   UUID REFERENCES projects(id),
  "entryType"   VARCHAR NOT NULL DEFAULT 'project',
  "remark"      TEXT NULL,
  "monHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "tueHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "wedHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "thuHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "friHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "satHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "sunHours"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "isDeleted"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);`}
                </pre>
              </Typography.Paragraph>
              <Typography.Paragraph className="mt-4 text-[var(--text-very-muted)] text-sm">
                <strong>ALTER reference (adding remark to an existing timesheet_rows table):</strong>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`ALTER TABLE timesheet_rows
  ADD COLUMN "remark" TEXT NULL;`}
                </pre>
              </Typography.Paragraph>
            </>
          )}

          {idx === 4 && (
            <Typography.Paragraph>
              <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`CREATE TABLE project_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR NOT NULL UNIQUE,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Optional seed data:
INSERT INTO project_categories (name) VALUES
  ('Residential'), ('Commercial'), ('Institutional'), ('Infrastructure');`}
              </pre>
            </Typography.Paragraph>
          )}

          {idx === 5 && (
            <Typography.Paragraph>
              <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`CREATE TABLE material_requirements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "enquiryNo" VARCHAR NOT NULL UNIQUE,
  "vendorId"  UUID NOT NULL REFERENCES vendors(id),
  "projectId" UUID NOT NULL REFERENCES projects(id),
  notes       TEXT,
  items       JSONB NOT NULL DEFAULT '[]',
  status      VARCHAR(50) NOT NULL DEFAULT 'draft',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);`}
              </pre>
            </Typography.Paragraph>
          )}

          {idx === 6 && (
            <>
              <Typography.Paragraph className="mt-4 text-[var(--text-very-muted)] text-sm">
                <strong>SQL ALTER reference (adding columns to the existing projects table):</strong>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <pre className="bg-[var(--card-bg)] text-[var(--text-primary)] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`-- If the projects table already has rows, add "projectCode" nullable first,
-- backfill unique values, then apply NOT NULL + UNIQUE.
ALTER TABLE projects
  ADD COLUMN "projectCode"       VARCHAR,
  ADD COLUMN "projectCategoryId" UUID NULL REFERENCES project_categories(id),
  ADD COLUMN "projectNature"     VARCHAR NULL,
  ADD COLUMN "jobType"           VARCHAR NULL,
  ADD COLUMN "jobStatus"         VARCHAR NOT NULL DEFAULT 'bidding',
  ADD COLUMN "financialYear"     VARCHAR NULL,
  ADD COLUMN "dateOfCreation"    DATE NULL;

-- After backfilling projectCode for existing rows:
ALTER TABLE projects
  ALTER COLUMN "projectCode" SET NOT NULL,
  ADD CONSTRAINT uq_projects_project_code UNIQUE ("projectCode");

-- Join table for "Resources Assigned" (many-to-many projects <-> users):
CREATE TABLE project_resources (
  "projectId" UUID NOT NULL REFERENCES projects(id),
  "userId"    UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY ("projectId", "userId")
);`}
                </pre>
              </Typography.Paragraph>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
