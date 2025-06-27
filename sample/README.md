# Sample Data for Data Alchemist Testing

This folder contains sample CSV files with intentional data discrepancies for testing the Data Alchemist application.

## Files Overview

### 1. workers.csv (30 entries)

Contains worker/employee data with the following intentional issues:

- **Missing closing bracket** in skills JSON (row 3: Mike Davis)
- **Empty hourly_rate** (rows 4 & 15: Emily Wilson, James Wilson)
- **Missing email** (row 12: Maria Rodriguez)
- **Missing name** (row 26: empty name field)
- **Invalid JSON format** in skills (row 6: nested object instead of array)
- **Null skills** (row 22: Nicole Taylor)
- **Inactive status** for some workers (rows 9 & 23)

### 2. tasks.csv (30 entries)

Contains project tasks with the following discrepancies:

- **Various task statuses**: pending, in-progress, completed
- **Different priority levels**: high, medium, low
- **Multiple phases**: 1, 2, 3
- **Duration range**: 1.5 to 6.5 hours
- **Complex skill requirements**: Mix of technologies and specializations
- **Realistic deadlines**: July-August 2025 timeframe

### 3. clients.csv (30 entries)

Contains client information with intentional issues:

- **Missing email** (row 3: Healthcare Plus)
- **Missing phone** (row 4: RetailMax Inc)
- **Missing company name** (rows 8 & 28: logistics and marketing companies)
- **Missing contact email** (row 18: Legal Services)
- **Various industries**: Technology, Finance, Healthcare, E-commerce, etc.
- **Different budget ranges**: $25,000 to $150,000
- **Mixed project statuses**: active, pending, in-progress, completed
- **Different payment terms**: Net 15, Net 30, Net 45, Net 60

### 4. projects.csv (30 entries)

Links clients to tasks and contains:

- **Project relationships**: Links client_id to task_ids
- **Technology stacks**: Various combinations of technologies
- **Progress tracking**: 0% to 100% completion
- **Risk levels**: low, medium, high
- **Team sizes**: 1 to 6 members
- **Realistic timelines**: 2025 project dates

## Data Discrepancies for Testing

### JSON Issues

- Malformed JSON arrays in skills fields
- Mixed JSON formats (arrays vs objects)
- Null values where JSON arrays expected

### Missing Data

- Empty required fields (name, email, hourly_rate)
- Null values in critical columns
- Incomplete contact information

### Data Type Issues

- String values where numbers expected
- Inconsistent formatting across similar fields
- Mixed data types in same columns

### Relationship Issues

- Worker IDs that may not exist in workers.csv
- Task IDs spanning multiple projects
- Client-project relationships

## Testing Scenarios

### AI Assistant Testing

Try these queries with the AI Assistant:

1. "Fix all broken JSON fields"
2. "Show tasks with duration > 2 and prefer phase 2"
3. "Add a co-run rule between Task T1 and T2"
4. "Find workers with missing rate information"
5. "Optimize for fair distribution"

### Data Validation Testing

- Upload each CSV file individually
- Check for validation errors and warnings
- Test data cleaning suggestions
- Verify relationship integrity

### Rule Builder Testing

- Create co-run rules for related tasks
- Set up priority rules based on client importance
- Define skill-matching rules for worker assignment
- Create timeline-based rules for project phases

### Export Testing

- Export cleaned data in various formats
- Test filtered exports by status, priority, etc.
- Verify data integrity after export

## Expected Behaviors

1. **Upload Validation**: Should identify and flag data issues
2. **AI Suggestions**: Should provide actionable recommendations
3. **Data Cleaning**: Should offer automatic fixes for common issues
4. **Rule Creation**: Should enable complex business rule definitions
5. **Export Functions**: Should generate clean, usable data files

## Usage Instructions

1. Start the Data Alchemist application
2. Upload the CSV files one by one using the upload zone
3. Review validation results and data quality reports
4. Use the AI Assistant to identify and fix issues
5. Create rules for data processing and worker assignment
6. Test export functionality with cleaned data
7. Verify all features work as expected with realistic data

This sample data provides a comprehensive testing environment for all Data Alchemist features while maintaining realistic business scenarios and common data quality issues.
