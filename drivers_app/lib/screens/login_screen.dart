import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'main_screen.dart';

/// Minimal login screen — MVP: vehicle_id only, no password.
class LoginScreen extends StatefulWidget {
  final ApiService api;

  const LoginScreen({super.key, required this.api});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _vehicleIdCtrl = TextEditingController();
  bool _isLoading = false;
  String? _error;

  Future<void> _login() async {
    final vid = _vehicleIdCtrl.text.trim();
    if (vid.isEmpty) {
      setState(() => _error = 'Enter a Vehicle ID');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await widget.api.login(vid);
      print('Login result: $result');

      if (!mounted) return;

      if (result.success) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) =>
                MainScreen(api: widget.api, vehicleId: result.vehicleId),
            transitionsBuilder: (_, a, __, child) =>
                FadeTransition(opacity: a, child: child),
            transitionDuration: const Duration(milliseconds: 300),
          ),
        );
      } else {
        setState(() => _error = result.errorMessage ?? 'Vehicle not found');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Connection error — is the backend running?');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.local_shipping_rounded,
                size: 48,
                color: AppTheme.primary,
              ),
              const SizedBox(height: 20),
              const Text(
                'Crisis Logistics',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textHigh,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Driver Portal',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textLow,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 40),

              TextField(
                controller: _vehicleIdCtrl,
                style: const TextStyle(color: AppTheme.textHigh, fontSize: 15),
                decoration: const InputDecoration(
                  labelText: 'Vehicle ID',
                  hintText: 'e.g. V0001',
                  prefixIcon: Icon(
                    Icons.badge_rounded,
                    color: AppTheme.textLow,
                    size: 18,
                  ),
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: AppTheme.danger,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 24),

              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Log In'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
