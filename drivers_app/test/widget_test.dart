import 'package:flutter_test/flutter_test.dart';

import 'package:drivers_app/main.dart';

void main() {
  testWidgets('App renders login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const CrisisLogisticsApp());
    await tester.pumpAndSettle();

    // Verify login screen is displayed.
    expect(find.text('Crisis Logistics'), findsOneWidget);
    expect(find.text('Log In'), findsOneWidget);
  });
}
