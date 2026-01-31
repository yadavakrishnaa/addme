
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_add_alt_1, size: 100, color: Colors.blueAccent),
            const SizedBox(height: 20),
            const Text("Add Me", style: TextStyle(fontSize: 42, fontWeight: FontWeight.bold)),
            const Text("The perfect group photo, with you in it.", style: TextStyle(color: Colors.white60)),
            const SizedBox(height: 60),
            _buildButton(context, "Start New Project", Icons.camera, () async {
              if (await Permission.camera.request().isGranted) {
                Navigator.pushNamed(context, '/capture');
              }
            }, true),
            const SizedBox(height: 15),
            _buildButton(context, "Gallery", Icons.photo_library, () {
              Navigator.pushNamed(context, '/gallery');
            }, false),
          ],
        ),
      ),
    );
  }

  Widget _buildButton(BuildContext context, String text, IconData icon, VoidCallback tap, bool primary) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton.icon(
        icon: Icon(icon),
        label: Text(text),
        style: ElevatedButton.styleFrom(
          backgroundColor: primary ? Colors.white : Colors.transparent,
          foregroundColor: primary ? Colors.black : Colors.white,
          side: primary ? null : const BorderSide(color: Colors.white24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        onPressed: tap,
      ),
    );
  }
}
