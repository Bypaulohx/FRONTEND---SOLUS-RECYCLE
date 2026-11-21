import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

/// Geolocalização e abertura de apps externos (mapas e discador).
class External {
  static Future<({double latitude, double longitude})?> currentPosition() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 8),
        ),
      );
      return (latitude: position.latitude, longitude: position.longitude);
    } catch (_) {
      return null;
    }
  }

  static Future<bool> open(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      return false;
    }
  }

  static Future<bool> call(String phone) async {
    final digits = phone.replaceAll(RegExp(r'[^\d+]'), '');
    if (digits.isEmpty) return false;
    return open('tel:$digits');
  }

  static Future<double?> distanceKm(double lat1, double lon1, double lat2, double lon2) async =>
      Geolocator.distanceBetween(lat1, lon1, lat2, lon2) / 1000;
}
