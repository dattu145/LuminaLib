<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log state-changing methods (POST, PUT, DELETE)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $user = $request->user();
            $logData = [
                'timestamp' => now()->toDateTimeString(),
                'user_id' => $user ? $user->id : 'guest',
                'user_name' => $user ? $user->name : 'guest',
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'payload' => $request->except(['password', 'password_confirmation', 'current_password']),
                'ip' => $request->ip(),
                'status_code' => $response->getStatusCode(),
            ];

            Log::channel('daily')->info('AUDIT_LOG: ' . json_encode($logData));
        }

        return $response;
    }
}
