use artcraft_image_bridge::Bridge;
use std::{collections::BTreeMap, fs, path::Path};
use uuid::Uuid;

mod retained_evidence {
  use super::*;

  #[test]
  fn unknown_and_accepted_states_survive_read_only_reports_without_source() -> anyhow::Result<()> {
    let temp = tempfile::tempdir()?;
    let root = temp.path().join("images");
    fs::create_dir(&root)?;
    let image = root.join("fixture.png");
    image::RgbaImage::new(2, 2).save(&image)?;
    let state = temp.path().join("state");
    let bridge = Bridge::new(&root, &state, false)?;
    let id = Uuid::new_v4();
    let hash = bridge.inspect(&image)?.sha256;
    let (mut record, _) = bridge.prepare_live(&image, &hash, id)?;
    fs::remove_file(&image)?;
    for (status, token, assessment) in [
      (
        "upload_outcome_unknown",
        None,
        "needs_manual_reconciliation",
      ),
      (
        "uploaded_metadata_pending",
        Some("m_fixture"),
        "accepted_metadata_pending",
      ),
      (
        "uploaded_metadata_verified_link_access_not_private",
        Some("m_fixture"),
        "metadata_previously_verified",
      ),
    ] {
      record.status = status.into();
      record.maybe_media_file_token = token.map(String::from);
      bridge.save_live_result(&record)?;
      let before = snapshot(&state)?;
      let restarted = Bridge::new(&root, &state, false)?;
      let report = restarted.recovery_report(id)?;
      assert_eq!(report.assessment, assessment);
      assert!(!report.remote_checked);
      assert_eq!(report.maybe_record.unwrap().image.sha256, hash);
      assert_eq!(before, snapshot(&state)?);
    }
    Ok(())
  }

  #[test]
  fn missing_unrecognized_and_corrupt_records_do_not_authorize_retry() -> anyhow::Result<()> {
    let temp = tempfile::tempdir()?;
    let root = temp.path().join("images");
    fs::create_dir(&root)?;
    let state = temp.path().join("state");
    let bridge = Bridge::new(&root, &state, false)?;
    let id = Uuid::new_v4();
    assert_eq!(bridge.recovery_report(id)?.assessment, "no_local_record");
    assert!(snapshot(&state)?.is_empty());
    let image = root.join("fixture.png");
    image::RgbaImage::new(2, 2).save(&image)?;
    let (mut record, _) = bridge.prepare_live(&image, &bridge.inspect(&image)?.sha256, id)?;
    record.status = "future_status".into();
    bridge.save_live_result(&record)?;
    assert_eq!(
      bridge.recovery_report(id)?.assessment,
      "unrecognized_record"
    );
    record.status = "uploaded_metadata_pending".into();
    bridge.save_live_result(&record)?;
    assert_eq!(
      bridge.recovery_report(id)?.assessment,
      "unrecognized_record"
    );
    fs::write(state.join(format!("{id}.json")), b"broken JSON")?;
    let before = snapshot(&state)?;
    assert!(bridge.recovery_report(id).is_err());
    assert_eq!(before, snapshot(&state)?);
    Ok(())
  }

  #[test]
  fn mock_report_checks_bytes_and_detects_corruption() -> anyhow::Result<()> {
    let temp = tempfile::tempdir()?;
    let root = temp.path().join("images");
    fs::create_dir(&root)?;
    let state = temp.path().join("state");
    let bridge = Bridge::new(&root, &state, true)?;
    let image = root.join("fixture.png");
    image::RgbaImage::new(2, 2).save(&image)?;
    let id = Uuid::new_v4();
    bridge.import(&image, &bridge.inspect(&image)?.sha256, id)?;
    let before = snapshot(&state)?;
    assert_eq!(
      bridge.recovery_report(id)?.assessment,
      "mock_bytes_verified"
    );
    assert_eq!(before, snapshot(&state)?);
    fs::write(state.join(format!("mock-{id}.image")), b"changed")?;
    let before = snapshot(&state)?;
    assert!(bridge.recovery_report(id).is_err());
    assert_eq!(before, snapshot(&state)?);
    Ok(())
  }
}

fn snapshot(state: &Path) -> anyhow::Result<BTreeMap<String, Vec<u8>>> {
  fs::read_dir(state)?
    .map(|entry| {
      let entry = entry?;
      Ok((
        entry.file_name().to_string_lossy().into_owned(),
        fs::read(entry.path())?,
      ))
    })
    .collect()
}
