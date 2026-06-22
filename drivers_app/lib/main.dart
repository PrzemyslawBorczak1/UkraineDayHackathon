import 'package:flutter/material.dart';

void main() {
  runApp(const CrisisLogisticsApp());
}

class CrisisLogisticsApp extends StatelessWidget {
  const CrisisLogisticsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Crisis Logistics',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueGrey,
          primary: Colors.blueGrey[800]!,
          secondary: Colors.amber[700]!,
          error: Colors.red[700]!,
        ),
        fontFamily: 'Roboto', // Modern, readable font
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.blueGrey[900],
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueGrey[800],
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}

// --- MODELS ---

class Vehicle {
  final String vehicleID;
  final String type;
  final double weight;
  final double payload;
  final double volume;
  final double operationalRange;
  final List<String> features;
  final List<String> restrictions;

  Vehicle({
    required this.vehicleID,
    required this.type,
    required this.weight,
    required this.payload,
    required this.volume,
    required this.operationalRange,
    required this.features,
    required this.restrictions,
  });
}

class Mission {
  final String id;
  final String cargoType;
  final DateTime startTime;
  final DateTime endTime;
  final String origin;
  final String destination;
  final double weight;
  final double volume;
  final List<String> specialRequirements;
  final Duration unloadingWaitTime;
  final bool isCurrent;

  Mission({
    required this.id,
    required this.cargoType,
    required this.startTime,
    required this.endTime,
    required this.origin,
    required this.destination,
    required this.weight,
    required this.volume,
    required this.specialRequirements,
    required this.unloadingWaitTime,
    required this.isCurrent,
  });
}

// --- MOCK DATA ---

final Vehicle mockVehicle = Vehicle(
  vehicleID: 'TRK-123',
  type: 'Heavy Truck (Cooler)',
  weight: 12000,
  payload: 24000,
  volume: 80,
  operationalRange: 1000,
  features: ['Temperature control', 'GPS Tracking', 'Reinforced frame'],
  restrictions: ['Can\'t park in public places', 'No entry to City Center'],
);

final List<Mission> mockMissions = [
  Mission(
    id: 'M-001',
    cargoType: 'Medicine',
    startTime: DateTime.now().add(const Duration(hours: 1)),
    endTime: DateTime.now().add(const Duration(hours: 5)),
    origin: 'Warsaw Depot',
    destination: 'Lviv Central Hospital',
    weight: 2000,
    volume: 15,
    specialRequirements: ['Temperature has to be kept at 2-8 C', 'Priority clearance'],
    unloadingWaitTime: const Duration(minutes: 45),
    isCurrent: true,
  ),
  Mission(
    id: 'M-002',
    cargoType: 'Food Rations',
    startTime: DateTime.now().add(const Duration(days: 1)),
    endTime: DateTime.now().add(const Duration(days: 1, hours: 8)),
    origin: 'Lviv Warehouse 4',
    destination: 'Kyiv Distribution Center',
    weight: 18000,
    volume: 60,
    specialRequirements: ['Dry storage only'],
    unloadingWaitTime: const Duration(hours: 2),
    isCurrent: false,
  ),
  Mission(
    id: 'M-003',
    cargoType: 'Blankets and Tents',
    startTime: DateTime.now().add(const Duration(days: 3)),
    endTime: DateTime.now().add(const Duration(days: 3, hours: 12)),
    origin: 'Kyiv Distribution Center',
    destination: 'Kharkiv Shelter',
    weight: 5000,
    volume: 40,
    specialRequirements: [],
    unloadingWaitTime: const Duration(hours: 1),
    isCurrent: false,
  ),
];

// --- SCREENS ---

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _vehicleIdController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  void _login() {
    // Basic mock authentication: just pass to main screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => MainScreen(
          vehicle: mockVehicle,
          missions: mockMissions,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Login'),
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.local_shipping,
                size: 100,
                color: Colors.blueGrey,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _vehicleIdController,
                decoration: const InputDecoration(
                  labelText: 'Login (Vehicle ID)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.badge),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _login,
                child: const Text('Log In'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MainScreen extends StatelessWidget {
  final Vehicle vehicle;
  final List<Mission> missions;

  const MainScreen({
    super.key,
    required this.vehicle,
    required this.missions,
  });

  void _openIncidentBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const IncidentBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.person),
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => ProfileScreen(vehicle: vehicle),
              ),
            );
          },
        ),
        title: const Text('Missions'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: missions.length,
        itemBuilder: (context, index) {
          final mission = missions[index];
          return MissionCard(mission: mission);
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openIncidentBottomSheet(context),
        backgroundColor: Theme.of(context).colorScheme.secondary,
        foregroundColor: Colors.black87,
        icon: const Icon(Icons.warning_amber_rounded),
        label: const Text('Incident', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  final Vehicle vehicle;

  const ProfileScreen({super.key, required this.vehicle});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(vehicle.type),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Icon(
                Icons.fire_truck,
                size: 120,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Features',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8.0,
              runSpacing: 4.0,
              children: vehicle.features.map((feature) {
                return Chip(
                  label: Text(feature),
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            const Text(
              'Specifications',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildSpecRow('Weight', '${vehicle.weight} kg'),
                    const Divider(),
                    _buildSpecRow('Payload', '${vehicle.payload} kg'),
                    const Divider(),
                    _buildSpecRow('Volume', '${vehicle.volume} m³'),
                    const Divider(),
                    _buildSpecRow('Operational Range', '${vehicle.operationalRange} km'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (vehicle.restrictions.isNotEmpty) ...[
              const Text(
                'Restrictions',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.red),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.red, width: 2),
                  borderRadius: BorderRadius.circular(8),
                  color: Colors.red[50],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: vehicle.restrictions
                      .map((r) => Padding(
                            padding: const EdgeInsets.only(bottom: 4.0),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.block, color: Colors.red, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    r,
                                    style: const TextStyle(
                                      color: Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ))
                      .toList(),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 16, color: Colors.black54)),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }
}

// --- WIDGETS ---

class MissionCard extends StatelessWidget {
  final Mission mission;

  const MissionCard({super.key, required this.mission});

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')} \n${time.day}/${time.month}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: mission.isCurrent ? 6 : 2,
      margin: const EdgeInsets.only(bottom: 16.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: mission.isCurrent ? Theme.of(context).colorScheme.primary : Colors.transparent,
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    mission.cargoType,
                    style: TextStyle(
                      fontSize: mission.isCurrent ? 24 : 18,
                      fontWeight: FontWeight.bold,
                      color: mission.isCurrent ? Theme.of(context).colorScheme.primary : Colors.black87,
                    ),
                  ),
                ),
                if (mission.isCurrent)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'ACTIVE',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (mission.isCurrent) ...[
              _buildTimeline(),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildDetailItem(Icons.scale, '${mission.weight} kg'),
                  _buildDetailItem(Icons.view_in_ar, '${mission.volume} m³'),
                  _buildDetailItem(Icons.hourglass_empty, '${mission.unloadingWaitTime.inMinutes} min wait'),
                ],
              ),
              const SizedBox(height: 16),
              if (mission.specialRequirements.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    border: Border.all(color: Colors.red[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Special Requirements',
                        style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      ...mission.specialRequirements.map((req) => Text(
                            '• $req',
                            style: TextStyle(color: Colors.red[900]),
                          )),
                    ],
                  ),
                )
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Start: ${_formatTime(mission.startTime)}'),
                        Text(mission.origin, style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('End: ${_formatTime(mission.endTime)}'),
                        Text(mission.destination, style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                const Icon(Icons.circle, color: Colors.blueGrey, size: 16),
                Container(
                  height: 40,
                  width: 2,
                  color: Colors.blueGrey[300],
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(mission.origin, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Start time: ${_formatTime(mission.startTime)}', style: const TextStyle(color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.location_on, color: Colors.red, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(mission.destination, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Est. arrival: ${_formatTime(mission.endTime)}', style: const TextStyle(color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDetailItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.blueGrey),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class IncidentBottomSheet extends StatefulWidget {
  const IncidentBottomSheet({super.key});

  @override
  State<IncidentBottomSheet> createState() => _IncidentBottomSheetState();
}

class _IncidentBottomSheetState extends State<IncidentBottomSheet> {
  String? _selectedType;
  final TextEditingController _delayController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  final List<String> _incidentTypes = ['Koniec misji', 'Opóźnienie'];

  void _submit() {
    if (_selectedType == null) return;

    // In a real app, this would send data to an API
    print('--- INCIDENT REPORT ---');
    print('Type: $_selectedType');
    if (_selectedType == 'Opóźnienie') {
      print('Delay Duration: ${_delayController.text}');
    }
    print('Description: ${_descriptionController.text}');
    print('-----------------------');

    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    // Accommodate keyboard
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(
        bottom: bottomInset + 24.0,
        top: 24.0,
        left: 24.0,
        right: 24.0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Theme.of(context).colorScheme.secondary, size: 32),
              const SizedBox(width: 12),
              const Text(
                'Report Incident',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'Incident Type',
              border: OutlineInputBorder(),
            ),
            value: _selectedType,
            items: _incidentTypes.map((type) {
              return DropdownMenuItem(value: type, child: Text(type));
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedType = value;
              });
            },
          ),
          if (_selectedType == 'Opóźnienie') ...[
            const SizedBox(height: 16),
            TextField(
              controller: _delayController,
              decoration: const InputDecoration(
                labelText: 'Delay Duration (e.g., 2 hours)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: _descriptionController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Opis (Description - Optional)',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: _selectedType == null ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.secondary,
                  foregroundColor: Colors.black87,
                ),
                child: const Text('Submit'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
