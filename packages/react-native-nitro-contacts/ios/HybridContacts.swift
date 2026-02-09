import Foundation
import Contacts
import NitroModules

class HybridContacts: HybridContactsSpec {

  // MARK: - HybridObject
  var memorySize: Int { return MemoryHelper.getSizeOf(self) }

  // MARK: - Private
  private let store = CNContactStore()

  private static let keysToFetch: [CNKeyDescriptor] = [
    CNContactIdentifierKey as CNKeyDescriptor,
    CNContactGivenNameKey as CNKeyDescriptor,
    CNContactMiddleNameKey as CNKeyDescriptor,
    CNContactFamilyNameKey as CNKeyDescriptor,
    CNContactOrganizationNameKey as CNKeyDescriptor,
    CNContactJobTitleKey as CNKeyDescriptor,
    CNContactDepartmentNameKey as CNKeyDescriptor,
    // CNContactNoteKey requires com.apple.developer.contacts.notes entitlement (iOS 13+).
    // Omitted to avoid CNErrorDomain Code=102 "Unauthorized Keys".
    CNContactBirthdayKey as CNKeyDescriptor,
    CNContactEmailAddressesKey as CNKeyDescriptor,
    CNContactPhoneNumbersKey as CNKeyDescriptor,
    CNContactPostalAddressesKey as CNKeyDescriptor,
    CNContactUrlAddressesKey as CNKeyDescriptor,
    CNContactImageDataAvailableKey as CNKeyDescriptor,
    CNContactThumbnailImageDataKey as CNKeyDescriptor,
  ]

  // MARK: - getPermissionStatus()

  func getPermissionStatus() throws -> PermissionStatus {
    let status = CNContactStore.authorizationStatus(for: .contacts)
    switch status {
    case .authorized:
      return .granted
    case .denied:
      return .denied
    case .restricted:
      return .denied
    case .notDetermined:
      return .notDetermined
    case .limited:
      return .limited
    @unknown default:
      return .notDetermined
    }
  }

  // MARK: - requestPermission()

  func requestPermission() throws -> Promise<Bool> {
    return Promise.async {
      do {
        let granted = try await self.store.requestAccess(for: .contacts)
        return granted
      } catch {
        return false
      }
    }
  }

  // MARK: - getAll()

  func getAll() throws -> Promise<[Contact]> {
    return Promise.async { [self] in
      var contacts: [Contact] = []

      let request = CNContactFetchRequest(keysToFetch: HybridContacts.keysToFetch)
      request.sortOrder = .givenName

      try self.store.enumerateContacts(with: request) { cnContact, _ in
        let contact = self.mapContact(cnContact)
        contacts.append(contact)
      }

      return contacts
    }
  }

  // MARK: - Mapping

  private func mapContact(_ cn: CNContact) -> Contact {
    let displayName = [cn.givenName, cn.middleName, cn.familyName]
      .filter { !$0.isEmpty }
      .joined(separator: " ")

    let birthday: String? = cn.birthday.flatMap { components in
      guard let date = Calendar.current.date(from: components) else { return nil }
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withFullDate]
      return formatter.string(from: date)
    }

    let thumbnailPath: String? = cn.imageDataAvailable
      ? saveThumbnail(data: cn.thumbnailImageData, identifier: cn.identifier)
      : nil

    return Contact(
      id: cn.identifier,
      displayName: displayName,
      givenName: cn.givenName,
      middleName: cn.middleName,
      familyName: cn.familyName,
      company: cn.organizationName,
      jobTitle: cn.jobTitle,
      department: cn.departmentName,
      note: "", // Requires com.apple.developer.contacts.notes entitlement
      birthday: birthday,
      emails: cn.emailAddresses.map { labeled in
        self.mapLabeledValue(
          id: cn.identifier,
          label: labeled.label,
          value: labeled.value as String
        )
      },
      phoneNumbers: cn.phoneNumbers.map { labeled in
        self.mapLabeledValue(
          id: cn.identifier,
          label: labeled.label,
          value: labeled.value.stringValue
        )
      },
      postalAddresses: cn.postalAddresses.map { self.mapPostalAddress($0) },
      urlAddresses: cn.urlAddresses.map { labeled in
        self.mapLabeledValue(
          id: cn.identifier,
          label: labeled.label,
          value: labeled.value as String
        )
      },
      thumbnailPath: thumbnailPath,
      hasImage: cn.imageDataAvailable
    )
  }

  private func mapLabeledValue(id: String, label: String?, value: String) -> LabeledValue {
    let resolvedLabel = label.flatMap {
      CNLabeledValue<NSString>.localizedString(forLabel: $0)
    } ?? ""
    return LabeledValue(id: id, label: resolvedLabel, value: value)
  }

  private func mapPostalAddress(_ labeled: CNLabeledValue<CNPostalAddress>) -> PostalAddress {
    let addr = labeled.value
    let resolvedLabel = labeled.label.flatMap {
      CNLabeledValue<NSString>.localizedString(forLabel: $0)
    } ?? ""
    return PostalAddress(
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isoCountryCode: addr.isoCountryCode,
      label: resolvedLabel
    )
  }

  private func saveThumbnail(data: Data?, identifier: String) -> String? {
    guard let imageData = data else { return nil }
    let fileName = "contact_thumb_\(identifier.hashValue).jpg"
    let tempDir = FileManager.default.temporaryDirectory
    let filePath = tempDir.appendingPathComponent(fileName)
    guard FileManager.default.createFile(atPath: filePath.path, contents: imageData) else {
      return nil
    }
    return filePath.path
  }
}
