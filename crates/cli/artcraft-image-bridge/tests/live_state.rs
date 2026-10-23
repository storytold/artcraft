use artcraft_image_bridge::Bridge;

#[test]
fn two_clients_share_state_but_only_one_claims_upload() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("fixture.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let state = temp.path().join("state");
  let first = Bridge::new(&root, &state, false)?;
  let second = Bridge::new(&root, &state, false)?;
  let hash = first.inspect(&image)?.sha256;
  let id = uuid::Uuid::new_v4();
  assert!(first.prepare_live(&image, &hash, id)?.1.is_some());
  assert!(second.prepare_live(&image, &hash, id)?.1.is_none());
  Ok(())
}

#[test]
fn uncertain_upload_survives_restart_without_reposting() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("fixture.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let state = temp.path().join("state");
  let id = uuid::Uuid::new_v4();
  let bridge = Bridge::new(&root, &state, false)?;
  let hash = bridge.inspect(&image)?.sha256;
  let (record, bytes) = bridge.prepare_live(&image, &hash, id)?;
  assert!(bytes.is_some());
  assert_eq!(record.status, "upload_outcome_unknown");
  assert!(bridge.prepare_live(&image, &hash, id)?.1.is_none());
  drop(bridge);
  let bridge = Bridge::new(&root, &state, false)?;
  assert!(bridge.prepare_live(&image, &hash, id)?.1.is_none());
  image::RgbaImage::new(3, 3).save(&image)?;
  assert!(bridge
    .prepare_live(&image, &bridge.inspect(&image)?.sha256, id)
    .is_err());
  Ok(())
}

#[test]
fn accepted_token_survives_without_another_upload() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("fixture.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let state = temp.path().join("state");
  let id = uuid::Uuid::new_v4();
  let bridge = Bridge::new(&root, &state, false)?;
  let hash = bridge.inspect(&image)?.sha256;
  let (mut record, _) = bridge.prepare_live(&image, &hash, id)?;
  record.maybe_media_file_token = Some("m_fixture".into());
  record.status = "uploaded_metadata_pending".into();
  bridge.save_live_result(&record)?;
  drop(bridge);
  let bridge = Bridge::new(&root, &state, false)?;
  let (again, bytes) = bridge.prepare_live(&image, &hash, id)?;
  assert!(bytes.is_none());
  assert_eq!(again.maybe_media_file_token.as_deref(), Some("m_fixture"));
  Ok(())
}

#[test]
fn live_preparation_rejects_mock_state_and_changed_source() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("fixture.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let bridge = Bridge::new(&root, &temp.path().join("mock"), true)?;
  let hash = bridge.inspect(&image)?.sha256;
  assert!(bridge
    .prepare_live(&image, &hash, uuid::Uuid::new_v4())
    .is_err());
  let live = Bridge::new(&root, &temp.path().join("live"), false)?;
  let id = uuid::Uuid::new_v4();
  assert!(live.prepare_live(&image, "wrong", id).is_err());
  assert!(live.get(id)?.is_none());
  live.prepare_live(&image, &hash, id)?;
  drop(live);
  let switched = Bridge::new(&root, &temp.path().join("live"), true)?;
  assert!(switched.import(&image, &hash, id).is_err());
  assert_eq!(switched.get(id)?.unwrap().backend, "artcraft_live");
  Ok(())
}
