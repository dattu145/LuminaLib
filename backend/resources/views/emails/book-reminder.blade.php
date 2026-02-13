<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #334155;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
        }
        .content p {
            margin-bottom: 24px;
        }
        .book-details {
            background-color: #f1f5f9;
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 32px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }
        .value {
            font-weight: 600;
            color: #0f172a;
        }
        .footer {
            padding: 32px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: transform 0.2s ease;
        }
        .footer-text {
            margin-top: 24px;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LuminaLib</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Library Management System</p>
        </div>
        <div class="content">
            <p>Hi <strong>{{ $studentName }}</strong>,</p>
            <p>{{ $messageBody }}</p>
            
            <div class="book-details">
                <div class="detail-row">
                    <span class="label">Book Title</span>
                    <span class="value">{{ $bookTitle }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Due Date</span>
                    <span class="value">{{ $dueDate }}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Fine per Day</span>
                    <span class="value">₹{{ $finePerDay }}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/my-loans" class="button">Visit My Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">
                &copy; {{ date('Y') }} LuminaLib. All rights reserved.<br>
                This is an automated reminder. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
